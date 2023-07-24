import requests 
from bs4 import BeautifulSoup 
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import json
import csv
import os
import pandas as pd

desired_departments = ['DECSI', 'DECEA', 'DEELT', 'DEENP']

def getDepartments(URL):
    r = requests.get(URL)
    departments_table = []
    departments_list = []
    soup = BeautifulSoup(r.text, 'html.parser')  # Use 'html.parser' as the parser

    # Find the table with the specified id
    table = soup.find('table', {'id': 'formPrincipal:tabela'})
    if table:
        tbody = table.find('tbody')

        # Find all <tr> elements within <tbody>
        tr_elements = tbody.find_all('tr')

        for i, tr in enumerate(tr_elements):
            tableCode = tr.find('span', {'id' : 'formPrincipal:tabela:{}:codigoDepartamento'.format(i)})
            tableName = tr.find('span', {'id' : 'formPrincipal:tabela:{}:descricao'.format(i)})
            if tableCode and tableCode.text.strip() in desired_departments:
                departments_table.append({
                    'id': tableCode.text.strip(),
                    'title': tableName.text.strip()
                })
                departments_list.append(tableCode.text.strip())

        df_departments = pd.DataFrame(departments_table)
        print(df_departments)
        return departments_table, departments_list


def getHTMLContent(URL, department):
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode to avoid opening a browser window
    driver = webdriver.Chrome(options=chrome_options)
    driver.get(URL)
    elem = driver.find_element(By.XPATH,"//*[text()='{}']".format(department))
    elem.click()
    URL = driver.current_url
    html_source = driver.page_source
    soup = BeautifulSoup(html_source,'lxml')
    driver.quit()
    return (soup)

def getFieldList(html_content, department, field):
    i = 0
    field_list = []
    while(i >= 0):
        
        for row in html_content.find_all('table', {'id' : 'formPrincipal:tabela'} ):
            
            if(row.find('span', {'id' : 'formPrincipal:tabela:{}:{}'.format(i, field)}) is None):
                i = -2
            else:
                field_string = row.find('span', {'id' : 'formPrincipal:tabela:{}:{}'.format(i, field)}).text
                field_list.append(field_string)
                # if i == 0:
                    
                #     title = field_string.find_parent('a').get('title') 
                #     print(title)
        i = i +1
    return(field_list)

def get_field_list(html_content, field):
    field_list = []
    table = html_content.find('table', {'id': 'formPrincipal:tabela'})
    if table:
        tbody = table.find('tbody')
        tr_elements = tbody.find_all('tr')

        for i, tr in enumerate(tr_elements):
            if field == 'descricao':
                span = tr.find('span', {'id': 'formPrincipal:tabela:{}:{}'.format(i, 'disciplina')})
                title = span.find_parent('a').get('title')  # Extract the 'title' attribute of the parent <a> tag
                field_list.append(title)
                continue

            span = tr.find('span', {'id': 'formPrincipal:tabela:{}:{}'.format(i, field)})
            field_list.append(span.text)

    return field_list

URL = "https://zeppelin10.ufop.br/HorarioAulas/"

departments_table, departments_list = getDepartments(URL)
with open("departmentos.json",'w') as file:
    file.write(json.dumps(departments_table, indent=4))

disc_dfs = []
for department in departments_list:
    print('\n\n', department)
    html_content = getHTMLContent(URL, department)
    columns_list = [
    'codigo',
    'disciplina',
    'descricao',
    'turma',
    'horario',
    'professores'
    ]
    columns_dict_list = {}
    
    for column_name in columns_list:
        field = get_field_list(html_content, column_name)
        print(column_name,"ok")
        columns_dict_list[column_name] = field
    
    
    columns_dict = {}
    for i in range(len(columns_dict_list['disciplina'])):

        columns_dict[i] = {
            'codigo' : columns_dict_list['codigo'][i],
            'disciplina' : columns_dict_list['disciplina'][i],
            'descricao' : columns_dict_list['descricao'][i],
        }
    newdf = pd.DataFrame(columns_dict_list)
    unique_df = newdf.drop_duplicates()

    print(unique_df)
    disc_dfs.append(unique_df)

# with open("disciplinas.json", 'w') as file:
#     file.write(json.dumps(dict_json, indent=4))