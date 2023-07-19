import requests 
from bs4 import BeautifulSoup 
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from pandas import DataFrame as DF
import json
import csv
import os

def getTabelaDepto(URL):
    r = requests.get(URL)
    tabela_depto = []

    soup = BeautifulSoup(r.text, 'lxml')

    depto_obj = {}

    for i in range(47):
        table = soup.find('span', {'id' : 'formPrincipal:tabela:{}:codigoDepartamento'.format(i)})
        tableNome = soup.find('span', {'id' : 'formPrincipal:tabela:{}:descricao'.format(i)})
        table2 = soup.find('a', {'href' : '#'})
        depto_obj[i] = {
            'nome': tableNome.text.strip(),
            'sigla': table.text.strip()
        }
        tabela_depto.append(depto_obj[i])
    return tabela_depto

def getDepartament(URL):
    r = requests.get(URL) 
    departaments_list = []

    soup = BeautifulSoup(r.text, 'lxml') 
    for i in range(47):
        table = soup.find('span', {'id' : 'formPrincipal:tabela:{}:codigoDepartamento'.format(i)})
        tableNome = soup.find('span', {'id' : 'formPrincipal:tabela:{}:descricao'.format(i)})
        table2 = soup.find('a', {'href' : '#'})
        departaments_list.append(table.text)
    return departaments_list


def getHTMLContent(URL, departament):
    driver = webdriver.Firefox()
    driver.get(URL)
    elem = driver.find_element(By.XPATH,"//*[text()='{}']".format(departament))
    elem.click()
    URL = driver.current_url
    html_source = driver.page_source
    soup = BeautifulSoup(html_source,'lxml')
    driver.quit()
    return (soup)

def getFieldList(html_content, departament, field):
    i = 0
    field_list = []
    while(i >= 0):
        for row in html_content.find_all('table', {'id' : 'formPrincipal:tabela'} ):
            if(row.find('span', {'id' : 'formPrincipal:tabela:{}:{}'.format(i, field)}) is None):
                i = -2
            else:
                field_string = row.find('span', {'id' : 'formPrincipal:tabela:{}:{}'.format(i, field)}).text
                field_list.append(field_string)
        i = i +1
    return(field_list)


URL = "https://zeppelin10.ufop.br/HorarioAulas/"
departaments_list = getDepartament(URL)
tabela_depto = getTabelaDepto(URL)
print(tabela_depto)
with open("departamentos.json",'w') as file:
    file.write(json.dumps(tabela_depto, indent=4))
    
dict_json = {}
for departament in departaments_list:
    print(departament)
    html_content = getHTMLContent(URL, departament)
    columns_list = ['disciplina',
    'codigo',
    'turma',
    'horario',
    'professores',
    'predio']
    columns_dict_list = {}
    
    departament_list = []
    for column_name in columns_list:
        field = getFieldList(html_content, departament, column_name)
        print(column_name,"ok")
        columns_dict_list[column_name] = field
    columns_dict = {}
    for i in range(len(columns_dict_list['disciplina'])):
        columns_dict[i] = {
            'disciplina' : columns_dict_list['disciplina'][i],
            'codigo' : columns_dict_list['codigo'][i],
            'turma' : columns_dict_list['turma'][i],
            'horario' : columns_dict_list['horario'][i],
            'professores' : columns_dict_list['professores'][i],
            'predio' : columns_dict_list['predio'][i]}
    dict_json[departament] = columns_dict

with open("disciplinas.json", 'w') as file:
    file.write(json.dumps(dict_json, indent=4))