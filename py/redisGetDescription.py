#!/usr/bin/env python
from socket import *
import web
import redis, json

red = redis.Redis(host='localhost', db=0)
s = socket()
address = ('localhost', 8080)
s.bind(address)
s.listen(4)
ns = s.accept()

while 1:
	try: 
		#Try to acquire the data from the given address
		data = ns.recv(8192)
		if not data:
			break
	except:
		#If an error is thrown then close the connection
		#ns.close()
		s.close()
		break

	result = red.srandmember(data)
	print (result)