<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

function leaderboard_records($db) {
  $sql = "
  SELECT name, score, MIN(level) as level FROM (
    SELECT
      lb2.name,
      lb2.score,
      lb2.level
    FROM (SELECT name, MAX(score) max_score FROM blox_leaderboard GROUP BY name) lb
    JOIN blox_leaderboard lb2 ON lb2.name = lb.name AND lb2.score = max_score
  ) t
  GROUP BY name, score
  ORDER BY score DESC
  LIMIT 10;
  ";
  $results = mysqli_query($db, $sql);
  
  /* Bucket by name. */
  $records = array();
  while ($entry = mysqli_fetch_assoc($results)) {
    $records[] = $entry;
  }
  return $records;
}

function add_leaderboard_record($params, $salt, $db) {
  if (!(isset($params['name']) && 
        isset($params['score']) && isset($params['level'])) &&
        isset($params['cert'])) {
    return;
  }
  
  $name = mysqli_real_escape_string($db, substr(trim($params['name']), 0, 16));
  if (strlen($name) == 0) {
    $name = 'Anonymous';
  }
  $score = intval($params['score']);
  if ($score < 0) return;
  $level = intval($params['level']);
  if ($level < 0 || $level > $score) return;
  
  $cert = mysqli_real_escape_string($db, $params['cert']);
  
  $ip = mysqli_real_escape_string($db, get_ip());
  
  if (!validRecordRequest($score, $level, $cert, $ip, $salt, $db)) {
    echo "Invalid recording request."; return;
  }
  if (recently_recorded($ip, $db)) {
    echo "Recently recorded."; return;
  }
  
  $sql = "INSERT INTO blox_leaderboard (`name`, `score`, `level`, `ip`, `date`)
          VALUES ('{$name}', {$score}, {$level}, '{$ip}', NOW())";
  mysqli_query($db, $sql);
}

/** Has this client just recently recorded a score? */
function recently_recorded($ip, $db) {
  return false; // disable for now
  
  $sql = "SELECT TIME_TO_SEC(TIMEDIFF(NOW(), MAX(`date`))) FROM blox_leaderboard WHERE ip = '{$ip}'";
  if ($timeDiff = mysqli_query($db, $sql)) {
    $timeDiff = mysqli_fetch_array($timeDiff);
    $timeDiff = $timeDiff[0];
    return $timeDiff && intval($timeDiff) < 2 * 60;
  }
  return true;
}

function get_ip() {
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

function num_recent_players($db) {
  $sql = "SELECT COUNT(DISTINCT ip) AS n FROM blox_certs WHERE TIME_TO_SEC(TIMEDIFF(NOW(), `date`)) <= 60 * 60 *24";
  $n = mysqli_fetch_assoc(mysqli_query($db, $sql));
  return $n['n'];
}


################################################################################
################################################################################
################################################################################

include 'blox_config.php';

$db = mysqli_connect('mysqlhost',
      $bloxConfig['db']['user'],
      $bloxConfig['db']['pass'],
      $bloxConfig['db']['db']);
if (!$db) {
  echo 'Failed to connect.'; exit(1);
}

if (isset($_POST['score'])) {
  add_leaderboard_record($_POST, $bloxConfig['salt'], $db);
}

$leaderboard = leaderboard_records($db);
$cert = encryptCert(makeCert($db), $bloxConfig['salt']);
$num_players = num_recent_players($db);

mysqli_close($db);

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

foreach ($leaderboard as $entry) {
  echo "<tr><td>{$entry['name']}</td><td class=\"score\">{$entry['score']}</td><td>{$entry['level']}</td></tr>\n";
}

?>

</table>

<?php

echo "<p id=\"num-recent-players\"><b>{$num_players}</b> players in the past day.</p>";

?>
