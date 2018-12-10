#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Mar 31 14:35:36 2018

@author: supriya
"""
import pandas as pd
import hashlib
import pyAesCrypt
import netifaces
from netaddr import IPNetwork, IPAddress


bufferSize = 64 * 1024
final_secret_key= netifaces.ifaddresses('eno1')[netifaces.AF_LINK][0]['addr']
a = hashlib.sha224(final_secret_key.encode('utf-8'))
final_secret_key = a.hexdigest()


def loadp(vish):
    
    pyAesCrypt.decryptFile('data.csv.aes', "../datafile2.csv", final_secret_key, bufferSize)
    f = pd.read_csv("../datafile2.csv")
    return f

def loado(vish):
    if IPAddress("192.168.0.224") in IPNetwork("192.168.0.0/24"):
        pyAesCrypt.decryptFile('data.csv.aes', "../datafile2.csv", final_secret_key, bufferSize)
    f = pd.read_csv("../datafile2.csv")
    return f
    
    
    


    
