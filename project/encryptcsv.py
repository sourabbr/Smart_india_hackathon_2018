import json
import pandas as pd

import hashlib
import pyAesCrypt

bufferSize = 64 * 1024




secret_key = "sourab"

a = hashlib.sha224(secret_key.encode('utf-8'))

final_secret_key = a.hexdigest()


d = pd.read_csv('./Downloads/datafile.csv')
pyAesCrypt.encryptFile("./Downloads/datafile.csv", "./Downloads/data.csv.aes", final_secret_key, bufferSize)

