#!/bin/bash 

google-chrome localhost:8000 &
python -m SimpleHTTPServer 8000
