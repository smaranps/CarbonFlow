from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
import uvicorn
import threading
from data import csv_thread
import pandas as pd
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API = os.getenv("GEMINI_API")

threading.Thread(target=csv_thread).start()

app = FastAPI()

# This code is BADDDDD, I know.
# Uses a weighted prediction algorithm to predict the year a country will be able to meet its climate goals, if it ever does.
@app.get("/climate_prediction_algo")
async def climate_prediction_algo(country: str):

    csv_path = os.path.join(os.getcwd(), "data", "country_ratings_data.csv")
    try:
        df = pd.read_csv(csv_path, index_col="Country")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="CSV file not found.")

    rating_map = {
        "Critically insufficient": 0,
        "Highly insufficient": 2,
        "Insufficient": 4,
        "Almost Sufficient": 7,
        "1.5°C global least cost": 9,
        "1.5°C compatible": 10,
        "1.5°C Paris Agreement compatible": 10,
        "Not assessed": 5,
        "Not applicable": 5,
        "Poor": 2,
        "Average": 5,
        "Acceptable": 7,
        "Information incomplete": 5,
        "No target": 0
    }

    def predict_for_row(row):
        overall_rating = rating_map.get(row.get("Overall rating"), 0)
        policies_and_action = rating_map.get(row.get("Policies and action"), 0)
        domestic_or_supported_target = rating_map.get(row.get("Domestic or supported target"), 0)
        fair_share_target = rating_map.get(row.get("Fair share target"), 0)
        climate_finance = rating_map.get(row.get("Climate finance"), 0)
        net_zero_target = rating_map.get(row.get("Net zero target"), 0)

        likelihood = (
            overall_rating * 0.3 +
            policies_and_action * 0.3 +
            domestic_or_supported_target * 0.2 +
            fair_share_target * 0.15 +
            climate_finance * 0.25 +
            net_zero_target * 0.15
        )
        likelihood = min(max(int(likelihood * 10), 0), 99)

        compat_cols = ["Policies and action", "Domestic or supported target", "Fair share target"]
        if any(row.get(col) in ["1.5°C compatible", "1.5°C global least cost", "1.5°C Paris Agreement compatible"] for col in compat_cols):
            year = "NOW"
            likelihood = 99
        else:
            earliest_year = 2030
            latest_year = 2100
            year = int(latest_year - (latest_year - earliest_year) * (likelihood / 100))

        return {"likelihood": likelihood, "year": year}

    if country.strip().lower() == "all":
        results = {}
        for _, r in df.reset_index().iterrows():
            results[r["Country"]] = predict_for_row(r)
        
        sorted_results = dict(sorted(
            results.items(),
            key=lambda x: (
                0 if x[1]['year'] == "NOW" else x[1]['year'],
                -x[1]['likelihood'] if x[1]['year'] == "NOW" else 0
            )
        ))
        return JSONResponse(content=sorted_results)

    if country not in df.index:
        raise HTTPException(status_code=404, detail=f"Country '{country}' not found in dataset.")

    row = df.loc[country]

    return JSONResponse(content=predict_for_row(row))

client = genai.Client(api_key=GEMINI_API)

@app.get("/gemini")
async def prompt(text):
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=text
    )
    data = {"insight": resp.text}
    print(data)
    return JSONResponse(data)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)