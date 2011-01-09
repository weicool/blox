<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <title>Blox</title>
  <meta name="keywords" content="blox, tetromino, game, puzzle" />
  <meta name="description" content="Blox is a fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines." />
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
      <script type="text/javascript"><!--
        google_ad_client = "ca-pub-1751948200611368";
        /* Blox Banner */
        google_ad_slot = "7178631606";
        google_ad_width = 468;
        google_ad_height = 60;
        //-->
      </script>
      <script type="text/javascript" src="http://pagead2.googlesyndication.com/pagead/show_ads.js"></script>
    </div>
    
    <h1>b l <img src="images/block_o.png" alt="o" /> x</h1>
  </div>
</div>

<div id="content">
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
        <li><span class="label">level</span> <span id="level">0</span></li>
      </ul>
      
      <input id="start_button" name="start_button" type="button" value="Start" />
      
      <div id="controls">
        <span class="label">controls</span>
        <img src="images/flip.png" id="flip_controls" alt="Flip buttons for rotating and dropping" title="Flip buttons for rotating and dropping" />
        <ul>
          <li><strong>up arrow</strong> rotates</li>
          <li><strong>spacebar</strong> drops</li>
          <li><strong>p</strong> pauses</li>
        </ul>
        <ul>
        <form action="">
          <input type="checkbox" name="mute" id="mute" />
          <label for="mute">mute</label>
        </form>
      </div>
    </div>
  </div>
  
  <embed id="sound_rotate" class="sfx" src="audio/rotate.wav" autostart="false" volume="10" />
  <embed id="sound_clear" class="sfx" src="audio/clear.mp3" autostart="false" volume="10" />
  <embed id="sound_clear_tetris" class="sfx" src="audio/clear_tetris.wav" autostart="false" volume="30" />
  
</div>

<div id="footer">
  <div id="about" class="info">
    <p>
    Blox is a fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines.
    It features beautiful tetrominoes, customizable controls,
    challenging gameplay, and a leaderboard to compete with players around the
    world. It was developed using HTML, CSS, and JavaScript.
    </p>
    
    <p>
    If you like this game, please <a href="blox.php">rate and review it</a> on the Chrome Web Store!
    </p>
    
    <p>
    <iframe id="facebook_like" src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.facebook.com%2Fpages%2FBlox%2F177930138901026&amp;layout=standard&amp;show_faces=false&amp;width=450&amp;action=like&amp;colorscheme=dark&amp;height=35" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
    </p>
    
    <p>
    A <a href="http://weicool.net">weicool</a> production.
    Thanks to <a href="http://belkadan.com/tetris/">this game</a> for the inspiration, 
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
