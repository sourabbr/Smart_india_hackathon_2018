import json
import pandas as pd
import sys
import hashlib
import pyAesCrypt

bufferSize = 64 * 1024


a = sys.argv

import netifaces


final_secret_key= netifaces.ifaddresses('eno1')[netifaces.AF_LINK][0]['addr']

a = hashlib.sha224(final_secret_key.encode('utf-8'))

final_secret_key = a.hexdigest()

try :
	json_data = open('datafile.json') 
	d = json.load(json_data)
	pyAesCrypt.encryptFile("datafile.json", "data.json.aes", final_secret_key, bufferSize)

except:
	d = pd.read_csv('datafile.csv')
	pyAesCrypt.encryptFile("datafile.csv", "data.csv.aes", final_secret_key, bufferSize)






