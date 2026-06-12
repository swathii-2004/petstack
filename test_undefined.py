import requests

try:
    res = requests.put("http://localhost:8000/pets/undefined", data={"name": "test"})
    print("PUT undefined:", res.status_code, res.text)
except Exception as e:
    print("PUT undefined error:", e)
