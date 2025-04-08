from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime, timedelta

def crawl_kbo_last_2weeks(filename="wanle.json"):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920x1080")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    games = []
    start_date = datetime(2025, 3, 22)  # 크롤링 시작 날짜
    
    for i in range(14):
        target_date = datetime.today() - timedelta(days=i)
        if target_date < start_date:  # 2025년 3월 22일 이전 데이터는 건너뜀
            continue
        date_str = target_date.strftime("%Y%m%d")
        human_date = target_date.strftime("%Y-%m-%d")
        url = f"https://www.koreabaseball.com/Schedule/GameCenter/Main.aspx?gameDate={date_str}"

        print(f"📆 {human_date} 크롤링 중...")
        try:
            driver.get(url)
            time.sleep(2)
            soup = BeautifulSoup(driver.page_source, "html.parser")

            # 실제 페이지에서 표시된 날짜 확인
            page_date_element = soup.select_one(".date-txt")
            if not page_date_element:
                print(f"❌ {human_date} 날짜 정보를 찾을 수 없습니다.")
                continue

            # 페이지 날짜를 YYYY-MM-DD 형식으로 변환
            raw_page_date = page_date_element.text.strip()  # 예: "2025.03.24(월)"
            try:
                page_date = datetime.strptime(raw_page_date.split("(")[0], "%Y.%m.%d").strftime("%Y-%m-%d")
            except ValueError:
                print(f"❌ {raw_page_date} 날짜 형식을 변환할 수 없습니다.")
                continue

            if page_date != human_date:  # URL의 날짜와 실제 페이지 날짜가 다르면 건너뜀
                print(f"⏩ {human_date} → 페이지 날짜 {page_date}, 건너뜁니다.")
                continue

            rows = soup.select("li.game-cont.end")
            for li in rows:
                away_team = li.get("away_nm", "").strip()
                home_team = li.get("home_nm", "").strip()
                away_score = li.select_one(".team.away .score").text.strip()
                home_score = li.select_one(".team.home .score").text.strip()

                games.append({
                    "date": page_date,  # 실제 페이지 날짜 사용
                    "home": home_team,
                    "away": away_team,
                    "score": f"{home_score} : {away_score}",
                    "highlight": ""
                })
        except Exception as e:
            print("❌ 에러:", e)
            continue

    driver.quit()

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(games, f, ensure_ascii=False, indent=2)

    print(f"✅ 총 {len(games)}경기 저장 완료 → {filename}")

if __name__ == "__main__":
    crawl_kbo_last_2weeks()
