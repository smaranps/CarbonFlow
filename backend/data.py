# Probably legal

def get_csv():
    import os
    import shutil
    import tempfile
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    import time

    url = "https://climateactiontracker.org/cat-data-explorer/country-ratings/"

    download_dir = tempfile.mkdtemp()
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--log-level=3")
    options.add_experimental_option("prefs", {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    })

    driver = webdriver.Chrome(options=options)

    try:
        driver.get(url)

        wait = WebDriverWait(driver, 5)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a[download="country ratings data.csv"]')))

        elems = driver.find_elements(By.CSS_SELECTOR, 'a[download="country ratings data.csv"]')
        for el in elems:
            driver.execute_script("arguments[0].click();", el)

        downloaded_file = None
        for _ in range(20):
            files = [f for f in os.listdir(download_dir) if f.endswith('.csv')]
            if files:
                downloaded_file = os.path.join(download_dir, files[0])
                break
            time.sleep(0.5)

    finally:
        driver.quit()

    if downloaded_file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_file:
            shutil.copyfile(downloaded_file, tmp_file.name)
            temp_path = tmp_file.name
        print(f"File downloaded to: {temp_path}")
    else:
        print("Download failed.")

    return temp_path

def csv_thread():
    import time
    import shutil
    import os
    while True:
        os.makedirs(os.path.join(os.getcwd(), "data"), exist_ok=True)
        file = get_csv()
        shutil.copy2(file, os.path.join(os.getcwd(), "data", "country_ratings_data.csv"))
        time.sleep(6000)