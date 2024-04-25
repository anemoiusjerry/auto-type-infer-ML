# Auto type inference for large spreadsheets
 Web App that takes spreadsheets and converts the columns to the correct datatypes automatically.

## Docker Quick Start
1. cd into root directory: "auto-type-infer-ML"
2. "docker-compose build"
3. "docker-compose up"
if that doesnt work download the images and yaml from 
https://drive.google.com/file/d/1noRbM54WlZv9qclDh5cuGu7TZ95dAcUf/view?usp=share_link

and run the following commands
- docker load -i jerry-backend.tar
- docker load -i jerry-frontend.tar
- docker-compose up

 ## Quick Start
 1. Open project folder in VS Code
 2. "cd server"
 3. "pipenv shell" to start the virtual env
 4. "pipenv install" to install python modules
 5. "python manage.py runserver" to start the backend
 6. "cd ../client"
 7. "npm i" to install frontend packages
 8. "npm start" to start the front end

 ## Thought process
 ### % of data analysed
 First thought was interating through every cell is obviously very slow and inefficient. How to avoid doing that? When a datatype has been inferred "n" times where n/total_rows >= 50% then we can stop and take this to be the correct datatype. Thus, avoiding analysing all rows.

 ### Speading up processing
 A major way to do this is with parallel processing, splitting the dataframe into chunks. However a problem emerged. If the algorithm in the above section is taken, then bias could occur. Consider just 1 column with 10 rows. We split that into 2 sets of 5 rows each. First set was predicted to have 2 strings, 3 ints; second set 4 strings, 1 int. We would get int and string leading to a 50-50 outcome. Clearly if the records we not split then string would have a majority.

 Thus, the inferred type count would need to be kept track of for all dataframe chunks. This nullifies the ability to stop at 50% threshold mentioned above for each chunk.

 ### Reconcile the problems
 Not analysing the entire dataframe still presents a significant time saving, how to incorporate that with the algorithm? If we take just a subset of total records assuming thats representative of the entire dataframe then perform inference of just that should be enough with some degrees of error. 70% of the dataframe was chosen as the convention for train-test set split in machine learning is usually 70-30. This number is arbitrary and can be changed.

 ### Algorithm
 1. Sample the dataframe first to randomly distribute records - minimise bias in row selection
 2. Take 70% of the rows
 3. Split dataframe into chunks 
 4. Perform inference for datatypes and keep track of counts in a dictionary
 5. Aggregate the counts and pick the datatype with max count

 ### Misc Notes / difficulties faced
 Had issues where a lot fo columns were detected as category. Logically if there are numeric, datetime or complex number types detected at a significant portion then the column is likely to not be categorical. It simply has a lot of repeat values. Boolean and string types could be categorical so leave them out of the counting.

 I initially wanted to utilise Django templates more to demonstrate my knowledge, but due to lazy loading I had to switch to sending data only, which is the more preferred way these days anyway.