<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>EEG Lab</title>
  <link rel="preload" href="assets/eeg-head.png" as="image">
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="nav">
    <div class="brand">EEG Lab</div>
    <nav>
      <a href="#about">About</a>
      <a href="#work">Work</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <!-- Apple-like hero -->
    <section class="hero">
      <h1>Measure the mind.</h1>
      <p>High‑resolution EEG experiments, simplified.</p>
    </section>

    <!-- The scroll-driven visual -->
    <section class="spin-stage" id="spin-stage">
      <img
        id="eegHead"
        src="assets/eeg-head.png"
        alt="EEG cap on styrofoam head"
        width="1200"
        height="1200"
      />
      <div class="caption">Scroll to rotate</div>
    </section>

    <!-- Filler sections to give you scroll room -->
    <section class="panel" id="about">
      <h2>About</h2>
      <p>
        We build experiments that turn brain signals into insights—real‑time pipelines,
        artifact handling, and reproducible analysis.
      </p>
    </section>

    <section class="panel" id="work">
      <h2>Recent Work</h2>
      <ul>
        <li>Trust in automation under time pressure</li>
        <li>Closed‑loop alpha modulation for workload</li>
        <li>Dual‑stream attention with fNIRS + EEG</li>
      </ul>
    </section>

    <section class="panel" id="contact">
      <h2>Contact</h2>
      <p>DMs open. Collaborations welcome.</p>
    </section>
  </main>

  <footer class="footer">© <span id="year"></span> EEG Lab</footer>
  <script src="script.js"></script>
</body>
</html>
