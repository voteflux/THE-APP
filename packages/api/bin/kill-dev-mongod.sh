#!/bin/bash 

for pid in $(ps ax | grep 'mongod' | grep 'port 53799' | cut -d ' ' -f 1); do 
  kill "$pid"
done
