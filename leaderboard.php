<?php

function leaderboardRecords($db) {
  $sql = "SELECT `name`, `score`, `level` FROM blox_leaderboard ORDER BY `score` DESC, `level` DESC LIMIT 12";
  return mysql_query($sql, $db);
}

function addLeaderboardRecord($params, $db) {
  if (!(isset($params['name']) && isset($params['score']) && isset($params['level']))) {
    return;
  }
  
  $name = mysql_real_escape_string(substr(stripslashes(trim($params['name'])), 0, 16), $db);
  if (strlen($name) == 0) {
    $name = 'Anonymous';
  }
  $score = (int) $params['score'];
  if ($score < 0) return;
  $level = (int) $params['level'];
  if ($level < 0 || $level > $score) return;
  
  $ip = mysql_real_escape_string(getIP(), $db);
  if (!recentlyRecorded($ip, $db)) {
    return;
  }
  
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

/** Has this client just recently recorded a score? */
function recentlyRecorded($ip, $db) {
  $sql = "SELECT TIME_TO_SEC(TIMEDIFF(NOW(), MAX(`date`))) FROM blox_leaderboard WHERE ip = '{$ip}'";
  if ($timeDiff = mysql_query($sql, $db)) {
    $timeDiff = mysql_fetch_array($timeDiff);
    $timeDiff = $timeDiff[0];
    return $timeDiff || ((int) $timeDiff) < 2 * 60;
  }
  return true;
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
  addLeaderboardRecord($_POST, $db);
}

$leaderboard = leaderboardRecords($db);

mysql_close($db);

?>


<span class="label">Leaderboard</span>

<table>
  <tr>
    <th class="name">Name</th>
    <th class="score">Score</th>
    <th class="level">Lvl</th>
  </tr>
  
<?php

while ($entry = mysql_fetch_assoc($leaderboard)) {
  echo "<tr><td>{$entry['name']}</td><td class=\"score\">{$entry['score']}</td><td>{$entry['level']}</td></tr>\n";
}

?>

</table>
