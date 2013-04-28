<?php 
$files = array();
$path = $_POST['path'];

if (empty($path)) {
	throw new Exception('Invalid path');
} else {
	if (is_dir($path) || file_exists($path)) {
		exec('ls -lh ' . $path . ' | grep ^-', $files);	// get list of files (without directories, links, headers, ...)
	} else {
		throw new Exception('Invalid path');
	}
}

echo json_encode($files);
?>