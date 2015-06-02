#!/bin/bash 

open -a Google\ Chrome http://localhost:8000 &
python -m SimpleHTTPServer 8000
