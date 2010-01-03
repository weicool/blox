<?php

function leaderboardRecords($db) {
  $sql = "SELECT `name` as name, `score`, `level` FROM blox_leaderboard ORDER BY `score` DESC, `level` DESC LIMIT 30";
  return mysql_query($sql, $db);
}

function addLeaderboardRecord($params, $salt, $db) {
  if (!(isset($params['name']) && 
        isset($params['score']) && isset($params['level'])) &&
        isset($params['cert'])) {
    return;
  }
  
  $name = mysql_real_escape_string(substr(trim($params['name']), 0, 16), $db);
  if (strlen($name) == 0) {
    $name = 'Anonymous';
  }
  $score = intval($params['score']);
  if ($score < 0) return;
  $level = intval($params['level']);
  if ($level < 0 || $level > $score) return;
  
  $cert = mysql_real_escape_string($params['cert'], $db);
  
  $ip = mysql_real_escape_string(getIP(), $db);
  
  if (!validRecordRequest($score, $level, $cert, $ip, $salt, $db)) {
    echo "Invalid recording request."; return;
  }
  if (recentlyRecorded($ip, $db)) {
    echo "Recently recorded."; return;
  }
  
  $sql = "INSERT INTO blox_leaderboard (`name`, `score`, `level`, `ip`, `date`)
          VALUES ('{$name}', {$score}, {$level}, '{$ip}', NOW())";
  mysql_query($sql, $db);
}

/** Has this client just recently recorded a score? */
function recentlyRecorded($ip, $db) {
  return false; // disable for now
  
  $sql = "SELECT TIME_TO_SEC(TIMEDIFF(NOW(), MAX(`date`))) FROM blox_leaderboard WHERE ip = '{$ip}'";
  if ($timeDiff = mysql_query($sql, $db)) {
    $timeDiff = mysql_fetch_array($timeDiff);
    $timeDiff = $timeDiff[0];
    return $timeDiff && intval($timeDiff) < 2 * 60;
  }
  return true;
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


################################################################################
################################################################################
################################################################################

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
  addLeaderboardRecord($_POST, $bloxConfig['salt'], $db);
}

$leaderboard = leaderboardRecords($db);
$cert = encryptCert(makeCert($db), $bloxConfig['salt']);

mysql_close($db);

?>


<span class="label">Leaderboard</span>

<div id="cert"><?php echo $cert; ?></div>

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
