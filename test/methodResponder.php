<?php

// retrieve the request method
$method = $_SERVER['REQUEST_METHOD'];

/**
 * return a response for each recognized request method to verify them
 */
switch($method) {
  case 'GET':
    echo 'received GET request. ' . PHP_EOL;
    break;

  case 'HEAD':
    echo 'received HEAD request. ' . PHP_EOL;
    break;

  case 'DELETE':
    echo 'received DELETE request. ' . PHP_EOL;
    break;

  case 'POST':
    echo 'received POST request.' . PHP_EOL;
    break;

  case 'PUT':
    echo 'received PUT request.' . PHP_EOL;
    break;

  case 'PATCH':
    echo 'received PATCH request.' . PHP_EOL;
    break;

  default:
    echo 'received request of unknown method.' . PHP_EOL;
}

echo 'Input stream:' . PHP_EOL;
var_dump(file_get_contents("php://input"));
