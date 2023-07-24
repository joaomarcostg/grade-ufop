import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from urllib.parse import urlparse

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run Chrome in headless mode
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

# Set up Chrome driver service
chromedriver_path = "path/to/chromedriver"  # Replace with the path to your chromedriver executable
service = Service(chromedriver_path)

# Set up Chrome driver
driver = webdriver.Chrome(service=service, options=chrome_options)

# Navigate to the URL
url = "https://www.escolha.ufop.br/cursos"
driver.get(url)

# Wait for the page to load
time.sleep(2)

# Find elements with class "ufop-glossary-row"
elements = driver.find_elements(By.CLASS_NAME, "ufop-glossary-row")

# Extract the href links from child anchor 'a' tags
links = []
for element in elements:
    link_element = element.find_element(By.TAG_NAME, "a")
    href = link_element.get_attribute("href")
    links.append(href)

# Create the "matrizes" folder if it doesn't exist
folder_path = './matrizes'
if not os.path.exists(folder_path):
    os.makedirs(folder_path)

# Navigate to each link and download PDF files
for link in links:
    driver.get(link)
    time.sleep(2)

    matriz_elements = driver.find_elements(By.CLASS_NAME, "field-name-field-matriz-curricular")
    pdf_links = []

    for element in matriz_elements:
        link_elements = element.find_elements(By.TAG_NAME, "a")
        for link_element in link_elements:
            href = link_element.get_attribute("href")
            pdf_links.append(href)

    for pdf_link in pdf_links:
        response = requests.get(pdf_link)
        parsed_url = urlparse(pdf_link)
        filename = f"matriz_{link.replace('https://www.escolha.ufop.br/cursos/', '')}.pdf"
        if parsed_url.query:
            filename = f"{parsed_url.query.replace('codCurso=', '')}.pdf"
        
        file_path = os.path.join(folder_path, filename)
        print(file_path)
        # print(parsed_url)
        # print(response.content)
        with open(file_path, "wb") as file:
            file.write(response.content)

# Quit the driver
driver.quit()
