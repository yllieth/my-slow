<?php 
$fileName = $_POST['file'];
$fileContent = null;

if (file_exists($fileName)) {
	$fileContent = file_get_contents($fileName);
} else {
	throw new Exception('Unknown file ' . $fileName);
}

echo $fileContent;
?>