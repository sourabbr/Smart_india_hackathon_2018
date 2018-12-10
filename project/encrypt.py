import json
import pandas as pd

import hashlib
import pyAesCrypt

bufferSize = 64 * 1024




secret_key = "sourab"

a = hashlib.sha224(secret_key.encode('utf-8'))

final_secret_key = a.hexdigest()

json_data = open('./Downloads/datafile.json') 
d = json.load(json_data)
pyAesCrypt.encryptFile("./Downloads/datafile.json", "./Downloads/data.json.aes", final_secret_key, bufferSize)


