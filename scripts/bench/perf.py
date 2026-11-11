import sys, json, time, subprocess, os
from playwright.sync_api import sync_playwright

url = sys.argv[1]; label = sys.argv[2]
cpu = float(sys.argv[3]) if len(sys.argv) > 3 else 4
mobile = (sys.argv[4] == "mobile") if len(sys.argv) > 4 else False

INIT = """
window.__long = []; window.__frames = [];
try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(e.duration))).observe({entryTypes:['longtask']}); } catch(e){}
"""
with sync_playwright() as p:
    b = p.chromium.launch(headless=True,
        args=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 390, "height": 844} if mobile else {"width": 1280, "height": 800},
                        device_scale_factor=3 if mobile else 2, is_mobile=mobile, has_touch=mobile)
    page = ctx.new_page()
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type in ("error",) else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.add_init_script(INIT)
    t0 = time.time()
    page.goto(url, wait_until="load")
    cdp = ctx.new_cdp_session(page)
    page.wait_for_timeout(2500)
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": cpu})
    load_long = page.evaluate("window.__long.slice()")
    # scroll test
    res = page.evaluate("""async () => {
      const H = document.documentElement.scrollHeight - innerHeight;
      const frames = [];
      let last = performance.now();
      const start = last;
      await new Promise(done => {
        function tick(now){
          frames.push(now - last); last = now;
          const t = (now - start) / 6000;
          if (t >= 1) return done();
          // ping-pong scroll over the page
          const k = t * 2; const f = k < 1 ? k : 2 - k;
          window.scrollTo(0, f * H);
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      window.scrollTo(0,0);
      return frames.slice(1);
    }""")
    res.sort()
    n = len(res); avg = sum(res)/n
    out = dict(label=label, cpu=cpu, mobile=mobile, frames=n, avg_ms=round(avg,1), fps=round(1000/avg,1),
               p50=round(res[n//2],1), p95=round(res[int(n*.95)],1), worst=round(res[-1],1),
               jank_over_33ms=sum(1 for x in res if x>33), longtasks_load=len(load_long), longtask_load_total_ms=round(sum(load_long)),
               console_errors=errs[:5])
    print(json.dumps(out))
    page.screenshot(path=f"{label}.png")
    b.close()
