import requests

url = "http://localhost:8000/pets"
# First let's do a GET to see what pets exist and what the backend is serving
try:
    # Just to test if the server is running, let's call health check
    res = requests.get("http://localhost:8000/health")
    print("Health:", res.status_code, res.text)
except Exception as e:
    print("Health error:", e)

# Now let's try a PUT with a dummy ID
try:
    res = requests.put("http://localhost:8000/pets/60c72b2f9b1d8b3a4c123456", data={"name": "test"})
    print("PUT dummy:", res.status_code, res.text)
except Exception as e:
    print("PUT dummy error:", e)
