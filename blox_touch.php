<!DOCTYPE html>
<html lang=en>
  <head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <title>Blox</title>
  <meta name="keywords" content="blox, tetromino, game, puzzle" />
  <meta name="description" content="Blox is a fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines. How long can you last?" />
  <meta property="og:image" content="http://weicool.net/blox/images/blox_icon.png" />
  <meta name="medium" content="game" />
  <link rel="shortcut icon" href="images/favicon.ico" />
  <link rel="stylesheet" type="text/css" href="blox.css" />
  <link rel="stylesheet" type="text/css" media="(max-width: 405px)" href="blox_phone.css" />
  <meta name="viewport" content="width=device-width; user-scalable=no;" />
  <link rel="apple-touch-icon" href="images/icon_128.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
</head>

<body class="touch">

<div id="content">
  <div id="blox_container">
    <div id="core">
      <table id="blox"></table>
      
      <div id="misc">
        <h1>blox</h1>
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
          <ul>
            <li><strong>double tap ▼</strong> to drop</li>
          </ul>
          <form action="">
            <input type="checkbox" name="mute" id="mute" />
            <label for="mute">mute</label>
          </form>
        </div>
      </div>
      <div id="buttons">
        <div class="button-container"><div id="button-left" class="button" title="Left Button"></div></div>
        <div id="button-down-container" class="button-container"><div id="button-down" class="button" title="Down Button"></div></div>
        <div id="button-rotate-container" class="button-container"><div id="button-rotate" class="button" title="Rotate Button"></div></div>
        <div class="button-container"><div id="button-right" class="button" title="Right Button"></div></div>
      </div>
    </div>
    
    <div id="leaderboard">
      <div id ="player-stats">
        <?php include 'leaderboard.php'; ?>
      </div>
      <div id="promo">
        <p id="social-promo">
          <iframe id="facebook-like" src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fwww.facebook.com%2Fbloxgame&amp;layout=box_count&amp;show_faces=false&amp;width=55&amp;action=like&amp;colorscheme=dark&amp;height=65" scrolling="no" frameborder="0" allowTransparency="true"></iframe>
          <a name="fb_share" type="box_count" share_url="http://weicool.net/blox" href="https://www.facebook.com/sharer.php">Share</a>
          <a href="http://twitter.com/share" class="twitter-share-button" data-url="http://weicool.net/blox" data-text="Blox: A fast-paced, action-packed puzzle game where you arrange falling tetrominoes to clear lines." data-count="vertical">Tweet</a>
        </p>
        <p id="blox-promo" style="display: none">
          <a href="blox.php" target="_blank"><b>Install</b> Blox</a> for Chrome.
        </p>
        <p id="blox-atom-promo">
          <a href="blox_atom.php" target="_blank"><b>Buy</b> Blox Atom</a>, the ad-free, offline Blox.
        </p>
      </div>
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

<div>
<script type="text/javascript">
var admob_vars = {
 pubid: 'a14d5a2c65a98f8', // publisher id
 bgcolor: '45973F', // background color (hex)
 text: 'FFFFFF', // font-color (hex)
 ama: false, // set to true and retain comma for the AdMob Adaptive Ad Unit, a special ad type designed for PC sites accessed from the iPhone.  More info: http://developer.admob.com/wiki/IPhone#Web_Integration
 test: true // test mode, set to false to receive live ads
};
</script>
<script type="text/javascript" src="http://mmv.admob.com/static/iphone/iadmob.js"></script>
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
    If you like this game, please <a href="blox.php" id="rate-link" target="_blank">rate and review it</a> on the Chrome Web Store!
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
<script type="text/javascript">
if (typeof chrome === 'undefined' || !chrome.app.isInstalled) {
  $('blox-promo').show();
}
</script>
<script src="http://static.ak.fbcdn.net/connect.php/js/FB.Share" type="text/javascript"></script>
<script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>

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
