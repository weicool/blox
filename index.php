<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Blox</title>
  <script type="text/javascript" src="../layout/js/prototype.js"></script>
  <script type="text/javascript" src="blox.js"></script>
  <link rel="stylesheet" type="text/css" href="blox.css" />
</head>

<body>

<!--[if lt IE 8]>
<p class="error">
  Blox is not compatible with Internet Explorer. Please use a more
  modern browser, such as <a href="http://www.apple.com/safari">Safari</a> or
  <a href="http://mozilla.com/firefox">Firefox</a>.
</p>
<![endif]-->

<div id="blox_container">
  <div id="leaderboard">
    <?php include 'leaderboard.php'; ?>
  </div>
  
  <table id="blox"></table>
  
  <div id="misc">
    <div id="next_container">
      <span class="label">next</span>
      <table id="next">
      </table>
    </div>
    
    <ul id="stats">
      <li><span class="label">score</span> <span id="score">0</span></li>
      <li><span class="label">lines</span> <span id="lines">0</span></li>
      <li><span class="label">level</span> <span id="level">0</li>
    </ul>
    
    <input id="start_button" name="start_button" type="button" value="Start" />
    
    <div id="controls">
      <span class="label">controls</span>
      <img src="images/flip.png" id="flip_controls" alt="Flip buttons for rotating and dropping" />
      <ul>
        <li><strong>up arrow</strong> rotates</li>
        <li><strong>spacebar</strong> drops</li>
        <li><strong>p</strong> pauses</li>
      <ul>
    </div>
  </div>
  
  <div class="info">
    A <a href="http://weicool.net">weicool</a> production.
    Thanks to <a href="http://belkadan.com/tetris/">this game</a> for the inspiration, 
    <a href="mailto:kinkyoto@gmail.com">Mark</a> for the block shading, and all
    my friends for testing.
  </div>
</div>

<!-- <embed id="music" class="sfx" src="http://upload.wikimedia.org/wikipedia/en/f/fe/Korobeiniki.mid" loop="true" volume="70" /> -->
<!-- <embed id="sound_clear" class="sfx" src="clear.mp3" autostart="false" volume="10" /> -->

</body>
</html>

<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
var pageTracker = _gat._getTracker("UA-297936-3");
pageTracker._trackPageview();
</script>
