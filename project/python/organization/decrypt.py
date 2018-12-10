import json
import pandas as pd
import sys
import hashlib
import pyAesCrypt

bufferSize = 64 * 1024

final_secret_key= "vishwas1234"

a = hashlib.sha224(final_secret_key.encode('utf-8'))

final_secret_key = a.hexdigest()

from netaddr import IPNetwork, IPAddress
if IPAddress("192.168.0.224") in IPNetwork("192.168.0.0/24"):
	pyAesCrypt.decryptFile('data.csv.aes', "datafile2.csv", final_secret_key, bufferSize)
