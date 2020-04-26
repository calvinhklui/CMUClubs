import os
import csv
import json
import requests
from bs4 import BeautifulSoup

from time import *
import datetime

def timeFn(f):
    def g(*args):
        start = time()
        requests = f(*args)
        msg = "request" if requests == 1 else "requests"
        print("Ran {} {} in {} seconds".format(requests,msg,time()-start))
    return g

class CMUDirStatic:
    def __init__(self,**kwargs):
        for kwarg in kwargs:
            exec("self.{} = \"{}\"".format(kwarg,kwargs[kwarg]))

    def getName(self,text):
        endKey = "(Student)"
        end = text.find(endKey)
        name = text[:end].split()
        return name[0],name[-1]

    def getClass(self,text,currDate):
        try:
            startKey = "Class Level:"
            endKey = "Names by Which This Person is Known"
            start,end = text.find(startKey),text.find(endKey)
            if currDate.month >= 8:
                fresh,soph,jun,sen = 4,3,2,1
            else:
                fresh,soph,jun,sen = 3,2,1,0
            classes = {"Freshman":fresh,"Sophomore":soph,"Junior":jun,
                       "Senior":sen,"5th Year Senior":sen,"Masters": None, "Doctoral": None}
            stuClass = text[start+len(startKey):end]
            if stuClass == "Masters" or stuClass == "Doctoral": return stuClass
            gradYear = str(int(currDate.year) + classes[stuClass])
            return gradYear
        except:
            pass

    def getEmail(self,text):
        startKey,endKey = "Email: ","Andrew UserID: "
        start,end = text.find(startKey),text.find(endKey)
        email = text[start+len(startKey):end]
        return email

    def getID(self,text):
        startKey,endKey = "Andrew UserID: ","Advisor"
        start,end = text.find(startKey),text.find(endKey)
        id = text[start+len(startKey):end]
        return id

    def getMajor(self,text):
        startKey,endKey = "this person is affiliated:","Student Class Level"
        start,end = text.find(startKey),text.find(endKey)
        major = text[start+len(startKey):end]
        return major

    def getAll(self,text):
        first,last = self.getName(text)
        currDate = datetime.datetime.now()
        gradYear = self.getClass(text,currDate)
        email = self.getEmail(text)
        id = self.getID(text)
        major = self.getMajor(text)
        return first,last,gradYear,email,id,major

    def numUpper(self,s):
        count = 0
        for char in s:
            if char.isupper():
                count += 1
        return count

    def cleanHTML(self,responseText):
        startIndicator,endIndicator = "directory name.","Acceptable Use:"
        start = responseText.find(startIndicator)
        end = responseText.find(endIndicator)
        start += len(startIndicator)
        return responseText[start:end].strip()

    @timeFn
    def accessDir(self,id):
        # initializing and getting directory request
        addOn = "?action=search&searchtype=basic&search="
        headers = {'user-agent': 'Chrome/60.0.3112.90'}
        numRequests = 0
        dirResponse = requests.get(self.url+addOn+id)
        numRequests += 1
        dirHTML = BeautifulSoup(dirResponse.text,"html.parser")
        # obtaining basic student credentials
        info = self.cleanHTML(dirHTML.text)
        first,last,gradYear,email,id,major = self.getAll(info)
        try:
            L = major.split()
            for i in range(len(L)):
                if self.numUpper(L[i]) > 1 and not L[i].isupper():
                    count = 0; ind = 0
                    while count <= 1:
                        if L[i][ind].isupper():
                            count += 1
                        ind += 1
                    major = " ".join(L[:i]) + " " + L[i][:ind-1]
                    break
        except Exception as e:
            print(e)
        # obtaining college by major
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)),'clubAPI/helpers/majorsByCollege.json'),"r") as f:
            d = json.load(f)
        college = ""
        if major in d:
            college = d[major]
        else:
            pass

        self.studentInfo = {"andrew_id" : id,
                            "email" : email,
                            "first_name" : first,
                            "last_name" : last,
                            "graduation_year" : gradYear,
                            "home_college" : college,
                            "primary_major" : major}
        return numRequests

#  INPUT: andrew_id
# OUTPUT: [andrew_id_valid,
#          {     'first_name' : '...',
#                 'last_name' : '...',
#                     'email' : '...',
#              'home_college' : '...',
#             'primary_major' : '...',
#           'graduation_year' : '...'}]
def lookup(andrew_id):
    andrew_id_valid = False

    cmuSearch = CMUDirStatic(url = "https://directory.andrew.cmu.edu/index.cgi")
    cmuSearch.accessDir(andrew_id)

    if len(cmuSearch.studentInfo["andrew_id"].split()) == 1:
        andrew_id_valid = True

    if andrew_id_valid:
        return [True, cmuSearch.studentInfo]
    else:
        return [False, {}]
