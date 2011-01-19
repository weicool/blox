<?php

include '/home/weicool/shared/config.inc.php';

$bloxConfig = array(
    'db' => array(
      'db' => 'blox',
      'user' => 'weicool',
      'pass' => 'soulcalibear1988'
    ),
    'salt' => 'thisniSAcVERYlsalty94367'
  );


function validRecordRequest($score, $level, $cert, $ip, $salt, $db) {
  if ($level == 0) {
    $level = 1;
  }
  
  /* Verify reasonable score. */
  if ($score > ($level+1) * 250) return false;
  
  /* Minimum time needed should be at least 1 second/line. */
  $minTimeNeeded = $level * 10;
  
  $sql = "DELETE FROM blox_certs
          WHERE ip = '{$ip}' AND
                MD5(CONCAT('{$salt}', `cert`)) = '{$cert}' AND
                TIME_TO_SEC(TIMEDIFF(NOW(), `date`)) >= {$minTimeNeeded}";
  mysql_query($sql, $db);
  
  return mysql_affected_rows($db) >= 1;
}

/** Make a certificate and record it for later. */
function makeCert($db) {
  $cert = strval(time());
  $ip = mysql_real_escape_string(get_ip(), $db);
  
  $sql = "INSERT INTO blox_certs (`cert`, `ip`, `date`)
          VALUES ('{$cert}', '{$ip}', NOW())";
  mysql_query($sql, $db);
  
  return $cert;
}

function encryptCert($cert, $salt) {
  return md5($salt . $cert);
}

?>
