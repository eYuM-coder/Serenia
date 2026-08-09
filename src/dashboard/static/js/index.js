(function () {
  var fog = document.getElementById("fogAtmosphere");
  if (!fog) return;
  var orbs = fog.querySelectorAll(".fog-orb");
  var start = performance.now();
  var lastPct = 0;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function updateFog(now) {
    var t = (now - start) / 1000;
    var sy = window.scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    var rawPct = max > 0 ? sy / max : 0;
    lastPct += (rawPct - lastPct) * 0.06;
    var easedPct = easeInOut(Math.max(0, Math.min(1, lastPct)));
    document.documentElement.style.setProperty("--scroll-y", sy + "px");
    document.documentElement.style.setProperty("--scroll-pct", easedPct);

    var configs = [
      {
        dx: 0.12,
        dy: 0.09,
        freq: 0.07,
        phaseX: 0,
        phaseY: 1.2,
        ampX: 40,
        ampY: 30,
        scrollAmp: 180,
      },
      {
        dx: 0.08,
        dy: 0.11,
        freq: 0.05,
        phaseX: 2.1,
        phaseY: 0.5,
        ampX: 50,
        ampY: 40,
        scrollAmp: 120,
      },
      {
        dx: 0.15,
        dy: 0.06,
        freq: 0.09,
        phaseX: 1.0,
        phaseY: 3.0,
        ampX: 60,
        ampY: 35,
        scrollAmp: 220,
      },
      {
        dx: 0.1,
        dy: 0.13,
        freq: 0.06,
        phaseX: 3.5,
        phaseY: 2.0,
        ampX: 30,
        ampY: 45,
        scrollAmp: 90,
      },
    ];

    orbs.forEach(function (o, i) {
      var c = configs[i] || configs[0];
      var driftX = Math.sin(t * c.freq + c.phaseX) * c.ampX;
      var driftY = Math.sin(t * c.freq * 0.7 + c.phaseY) * c.ampY;
      var scrollY = easedPct * c.scrollAmp * (i % 2 === 0 ? 1 : -1);
      var rot = Math.sin(t * 0.03 + i) * 1.5 + easedPct * 3;
      var s = 1 + Math.sin(t * 0.05 + i * 1.5) * 0.03 + easedPct * 0.04;
      o.style.transform =
        "translate3d(" +
        (driftX + scrollY * 0.15) +
        "px," +
        (driftY - scrollY) +
        "px,0) " +
        "rotate(" +
        rot +
        "deg) scale(" +
        s +
        ")";
    });

    requestAnimationFrame(updateFog);
  }

  requestAnimationFrame(updateFog);
})();
