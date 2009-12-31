<?php

function leaderboardRecords($db) {
  $sql = "SELECT `name`, `score`, `level` FROM blox_leaderboard ORDER BY `score` DESC LIMIT 10";
  return mysql_query($sql, $db);
}

function addLeaderboardRecord($db, $params) {
  if (!(isset($params['name']) && isset($params['score']) && isset($params['level']))) {
    return;
  }
  
  $name = substr(mysql_real_escape_string(stripslashes(trim($params['name'])), $db), 0, 16);
  if (strlen($name) == 0) {
    $name = 'Anonymous';
  }
  $score = (int) $params['score'];
  if ($score < 0) return;
  $level = (int) $params['level'];
  if ($level < 0 || $level > $score) return;
  
  $ip = mysql_real_escape_string(getIP(), $db);
  
  $sql = "INSERT INTO blox_leaderboard (`name`, `score`, `level`, `ip`, `date`)
          VALUES ('{$name}', {$score}, {$level}, '{$ip}', NOW())";

  mysql_query($sql, $db);
}

function getIP() {
  if (getenv('HTTP_CLIENT_IP')) {
    $ip = getenv('HTTP_CLIENT_IP');
  } else if (getenv('HTTP_X_FORWARDED_FOR')) {
    $ip = getenv('HTTP_X_FORWARDED_FOR');
  } else if (getenv('HTTP_X_FORWARDED')) {
    $ip = getenv('HTTP_X_FORWARDED');
  } else if (getenv('HTTP_FORWARDED_FOR')) {
    $ip = getenv('HTTP_FORWARDED_FOR');
  } else if (getenv('HTTP_FORWARDED')) {
    $ip = getenv('HTTP_FORWARDED');
  } else {
    $ip = $_SERVER['REMOTE_ADDR'];
  }
  return $ip;
}

include 'blox_config.php';

$db = mysql_connect('mysqlhost',
      $bloxConfig['db']['user'],
      $bloxConfig['db']['pass']);
if (!$db) {
  echo 'Failed to connect.'; exit(1);
}
if (!mysql_select_db($bloxConfig['db']['db'], $db)) {
  echo 'Cannot connect to leaderboard database.'; exit(1);
}

if (isset($_POST['score'])) {
  addLeaderboardRecord($db, $_POST);
}

$leaderboard = leaderboardRecords($db);

mysql_close($db);

?>

<div id="leaderboard">
  <span class="label">Leaderboard</span>
  
  <table>
    <tr>
      <th class="name">Name</th>
      <th class="score">Score</th>
      <th class="level">Lvl</th>
    </tr>
<?php
while ($entry = mysql_fetch_assoc($leaderboard)) {
  echo "<tr><td>{$entry['name']}</td><td>{$entry['score']}</td><td>{$entry['level']}</td></tr>\n";
}
?>
  </table>
</div>
