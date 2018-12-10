import json
import pandas as pd
import sys
import hashlib
import pyAesCrypt
import glob
import netifaces

bufferSize = 64 * 1024

final_secret_key= "sourab"

csv = './data.csv.aes'
js = './data.json.aes'


a = hashlib.sha224(final_secret_key.encode('utf-8'))

final_secret_key = a.hexdigest()

pyAesCrypt.decryptFile('./Downloads/data.csv.aes', "./Downloads/datafile2.csv", final_secret_key, bufferSize)

'''
for name in glob.glob('./*'):
    if name == csv:
    	pyAesCrypt.decryptFile(name, "datafile2.json", final_secret_key, bufferSize)
    else :
    	pyAesCrypt.decryptFile(name, "datafile2.csv", final_secret_key, bufferSize)

'''





#pyAesCrypt.decryptFile("data.txt.aes", "datafile2.csv", final_secret_key, bufferSize)


