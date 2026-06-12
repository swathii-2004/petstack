import requests

url = "http://localhost:8000/pets/60c72b2f9b1d8b3a4c123456"

# Test 1: with correct multipart (requests does it automatically)
try:
    res = requests.put(url, files={"photo": ("test.jpg", b"dummy")}, data={"name": "test"})
    print("PUT with correct multipart:", res.status_code, res.text)
except Exception as e:
    print("PUT correct error:", e)

# Test 2: with broken Content-Type (missing boundary)
try:
    res = requests.put(url, data=b"dummy", headers={"Content-Type": "multipart/form-data"})
    print("PUT with broken multipart:", res.status_code, res.text)
except Exception as e:
    print("PUT broken error:", e)
