# CMU Clubs
Rapidly onboard new members at the Activities Fair with CMU Clubs. Given an Andrew ID, the system scrapes the CMU Directory to fetch the corresponding member's name, major, and graduation year. The information is inserted into a structured table and can be exported for use in other roster management applications.

This web application was developed for student organizations at Carnegie Mellon University.

Brought to you by the [CMU Business Technology Group](https://cmubtg.com).

<b>Directory Lookup:</b> Dylan Chou, Juan Diego Meza  
<b>UX Design:</b> Matthew Guo  
<b>CSV Export:</b> Jenny Zhu  

## Development
Start the <b>Django REST</b> API server:
```
pipenv install
pipenv run python manage.py migrate
pipenv run python manage.py createsuperuser
pipenv run python manage.py runserver
```

Start the <b>React.js</b> client server:
```
cd TheClub/clubClient
npm install
npm start
```

## Usage
1) Create a club via the admin portal: http://localhost:8000/admin
2) Login to the application: http://localhost:3000
