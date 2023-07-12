import tabula
import pandas as pd
import numpy as np
import re

code_pattern = r'[A-Z]{3}\d{3}'
subject_pattern = r'\b[A-Z]+\b'
classes_pattern = r'^(T P|T|P)$'
prerequisite_pattern = r'[A-Z]{3}\d{3}|\d+\s+horas'
chs_che_pattern = r'^\d+\/\d+$'

def get_col_idx(df_value, pattern):
    indexes = []
    for i, item in enumerate(df_value):
        if i == 0:
            continue
        match = re.search(pattern, str(item), re.UNICODE)
        if match is not None:
            indexes.append(i)
        
    return indexes

def replace_carriage_return(arr):
    series = pd.Series(arr)

    # Replace '\r' with an empty string in the Series values
    series = series.astype(str).str.replace(r'\r', '')

    return series

def format_prerequisite_old(text):
    if not text:
        return ''

    matches = re.findall(prerequisite_pattern, text)
    joined_matches = ' '.join(matches)

    return joined_matches

def get_prerequisites(df_value):
    prerequisites = []
    prereq_idx = get_col_idx(df_value, prerequisite_pattern)
    if len(prereq_idx) > 0:
        prerequisites = [df_value[i] for i in prereq_idx]

    return format_prerequisites(prerequisites)

def get_subject(df_value):
    subject_idx = get_col_idx(df_value, subject_pattern)
    if len(subject_idx) > 0:
        return re.sub(prerequisite_pattern, '', df_value[subject_idx[0]])
    return ''

def get_chs_che(df_value):
    chs_che_idx = get_col_idx(df_value, chs_che_pattern)

    if len(chs_che_idx) > 0:
        chs_che_list = df_value[chs_che_idx[0]].split('/')
        return tuple(map(int, chs_che_list))
       
    return ('', '')

def get_classes(df_value, classes_idx):
    classes = []
    if len(classes_idx) > 0:
        classes = [df_value[i] for i in classes_idx]
        return ' '.join(classes)

    return ''

def get_period(df_value, eletiva):
    if eletiva or not df_value[0]:
        return ''

    for item in reversed(df_value):
        if item:
            return int(item)
    return ''

def get_cha(df_value, chs):
    if not chs:
        return ''
    
    chs_alt = chs * 1.2

    if len(df_value) == 0:
        return ''

    for text in df_value:
        try:
            formatted_text = int(text)
            if formatted_text == chs or formatted_text == chs_alt:
                return formatted_text
        except ValueError:
            continue
    
    return ''

def format_prerequisites(df_value):
    if len(df_value) == 0:
        return ''

    requisites = []
    for text in df_value:
        if not text:
            continue

        matches = re.findall(prerequisite_pattern, text)
        requisites.extend(matches)

    joined_matches = ' '.join(requisites)
    return joined_matches

def get_formatted_df(df, eletiva):

    df = df.replace({r'\r': ' '}, regex=True)
    df_struct = {'codigo': [], 'disciplina': [], 'prerequisitos': [], 'chs': [], 'che':[], 'cha': [], 'aulas': [], 'periodo': []}
    ideal_df = pd.DataFrame(data=df_struct)

    ideal_columns = ideal_df.columns.to_list()

    column_names = df.columns.tolist()
    disc_indexes = [i for i, item in enumerate(column_names) if 'DISCIPLINAS' in item]
   
    iterIdx = -1
    classes_idx = []
    
    for idx, value in enumerate(df.values):
        if idx == 0:
            iterIdx = -1
            classes_idx = get_col_idx(value, classes_pattern)
            ideal_df.at[0, ideal_columns[0]] = ''
            ideal_df.at[0, ideal_columns[1]] = ''
            ideal_df.at[0, ideal_columns[2]] = ''
            ideal_df.at[0, ideal_columns[3]] = ''
            ideal_df.at[0, ideal_columns[4]] = ''
            ideal_df.at[0, ideal_columns[5]] = ''
            ideal_df.at[0, ideal_columns[6]] = ''
            ideal_df.at[0, ideal_columns[7]] = ''
            continue

       
        chs, che = get_chs_che(value)
        ideal_df.at[idx, ideal_columns[0]] = value[0]
        ideal_df.at[idx, ideal_columns[1]] = get_subject(value)
        ideal_df.at[idx, ideal_columns[2]] = get_prerequisites(value)
        ideal_df.at[idx, ideal_columns[3]] = chs
        ideal_df.at[idx, ideal_columns[4]] = che
        ideal_df.at[idx, ideal_columns[5]] = get_cha(value, chs)
        ideal_df.at[idx, ideal_columns[6]] = get_classes(value, classes_idx)
        ideal_df.at[idx, ideal_columns[7]] = get_period(value, eletiva)

        if value[0] != '':
            iterIdx = -1
            continue

        if iterIdx == -1:
            iterIdx = idx - 1
      
        ideal_df.loc[iterIdx, :] = [f"{item1} {item2}".strip() for item1, item2 in zip(ideal_df.values[iterIdx], ideal_df.values[idx])]
        
    ideal_df.drop(ideal_df[ideal_df['codigo'] == ''].index, inplace = True)
    ideal_df[['chs', 'che', 'cha']] = ideal_df[['chs', 'che', 'cha']].astype(int)
    ideal_df['eletiva'] = eletiva
    
    return ideal_df

def save_table_to_csv(df):
    

    # Save the DataFrame to a CSV file
    filename = "table.csv"
    df.to_csv(filename, index=False)
    print(f"Table saved as {filename}")

def save_table_to_json(df):
    

    # Save the DataFrame to a CSV file
    filename = "table.json"
    df.to_json(filename, orient='records')
    print(f"Table saved as {filename}")

def scrape_table_from_pdf(pdf_path):
    # Read the table from the PDF file
    df_list = tabula.read_pdf(pdf_path, pages='all')

    # Initialize dictionaries to hold the extracted tables
    extracted_tables = {}

    # print(len(df_list))
    # Process each DataFrame separately

    list_a = []
    list_b = []

    dfs = []
    for df in df_list:
        df.fillna('', inplace=True)
        # Filter and select the desired columns based on the header
        header = df.columns.to_list()
        eletivas_column = next((col for col in header if 'DISCIPLINAS ELETIVAS' in col), None)
        obrigatorias_column = next((col for col in header if 'DISCIPLINAS OBRIGATÓRIAS' in col), None)
        # print(len(header), header)        
        # print(obrigatorias_column)        
        
        if 'DISCIPLINAS OBRIGATÓRIAS' in header:
            formatted_df = get_formatted_df(df, False)
            dfs.append(formatted_df)
       
        elif 'DISCIPLINAS ELETIVAS' in header or 'DISCIPLINAS ELETIVAS PRÉ-REQUISITO' in header:
            formatted_df = get_formatted_df(df, True)
            dfs.append(formatted_df)
        else:
            continue

        
   
    combined_df = pd.concat(dfs, ignore_index=True)
    # print(combined_df)
    # print(dfs)
    save_table_to_json(combined_df)
    return dfs

pdf_file = './CJM.pdf'
# pdf_file = './matrizCJM12023_1.pdf'
# pdf_file = './matrizCOM42023_1.pdf'
extracted_tables = scrape_table_from_pdf(pdf_file)
