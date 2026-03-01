import pdfplumber

def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        # Limit to first 5 pages to avoid huge context
        for page in pdf.pages[:5]:
            text += page.extract_text() or ""
        return text 

