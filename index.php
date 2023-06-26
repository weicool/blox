<?php
// error_reporting(E_ALL);
// ini_set('display_errors', '1');

/* Detect touch-based mobile devices and transfer if necessary. */
$devices = "/(mobile|android)/i";
if (preg_match($devices, $_SERVER['HTTP_USER_AGENT'])) {
  header('Location: blox_touch.php');
}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <title>Blox</title>
  <meta name="keywords" content="blox, tetromino, game, puzzle" />
  <meta name="description" content="Blox is a fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines." />
  <meta property="og:title" content="Blox" />
  <meta property="og:type" content="game" />
  <meta property="og:image" content="http://weicool.net/blox/images/blox_icon.png" />
  <meta property="og:url" content="http://weicool.net/blox/" />
  <meta name="medium" content="game" />
  <link rel="shortcut icon" href="images/favicon.ico" />
  <link rel="stylesheet" type="text/css" href="blox.css" />
</head>

<body>

<!--[if lt IE 8]>
<p class="error">
  Blox is not compatible with Internet Explorer. Please use a more
  modern browser, such as <a href="http://www.apple.com/safari">Safari</a> or
  <a href="http://www.google.com/chrome">Chrome</a>.
</p>
<![endif]-->

<div id="header">
  <div>
    <div id="gg">
      <script type="text/javascript">
        google_ad_client = "ca-pub-1751948200611368";
        /* Blox Banner */
        google_ad_slot = "7178631606";
        google_ad_width = 468;
        google_ad_height = 60;
      </script>
      <script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"></script>
    </div>
    
    <h1>blox</h1>
  </div>
</div>

<div id="content">
  <div id="blox_container">
    <div id="core">
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
          <li><span class="label">level</span> <span id="level">0</span></li>
        </ul>
        
        <button id="start_button" name="start_button">Start</button>
        
        <div id="controls">
          <span class="label">controls</span>
          <img src="images/flip.png" id="flip_controls" alt="Flip buttons for rotating and dropping" title="Flip buttons for rotating and dropping" />
          <ul>
            <li><strong>up arrow</strong> rotates</li>
            <li><strong>spacebar</strong> drops</li>
          </ul>
          <form action="">
            <input type="checkbox" name="mute" id="mute" />
            <label for="mute">mute</label>
          </form>
        </div>
      </div>
    </div>
    <div id="leaderboard">
      <?php include 'leaderboard.php'; ?>
      <p id="social-promo">
        <div id="fb-root"></div>
        <script src="http://connect.facebook.net/en_US/all.js#appId=208164312555656&amp;xfbml=1"></script>
        <fb:like href="https://www.facebook.com/bloxgame"
          send="true"
          layout="button_count"
          width="190"
          show_faces="true"
          colorscheme="dark"
          font="">
        </fb:like>
      </p>
    </div>
  </div>
  
  <audio id="sound_rotate" class="sfx">
    <source src="audio/rotate.mp3" />
    <source src="audio/rotate.wav" />
  </audio>
  <audio id="sound_clear" class="sfx">
    <source src="audio/clear.mp3" />
    <source src="audio/clear.wav" />
  </audio>
  <audio id="sound_clear_tetris" class="sfx">
    <source src="audio/clear_tetris.mp3" />
  </audio>
</div>

<div id="footer">
  <div id="about" class="info">
    <p>
    <strong>Blox</strong> is a fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines.
    It features beautiful tetrominoes, customizable controls,
    challenging gameplay, and a leaderboard to compete with players around the
    world. It was developed using HTML, CSS, and JavaScript.
    </p>
    
    <p>
    A <a href="http://weicool.net">weicool</a> production.
    Thanks to <a href="http://belkadan.com/tetris/" rel="nofollow">this game</a> for the inspiration,
    <a href="mailto:kinkyoto@gmail.com">Mark</a> for the block shading, and all
    my friends for testing.
    </p>
  </div>
</div>

<script type="text/javascript" src="prototype.js"></script>
<script type="text/javascript" src="blox.js"></script>

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
