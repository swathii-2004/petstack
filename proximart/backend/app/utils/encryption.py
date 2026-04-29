import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from app.config import settings

def encrypt(plain_text: str) -> str:
    if not plain_text:
        return plain_text
        
    iv = os.urandom(16)
    cipher = Cipher(
        algorithms.AES(settings.AES_SECRET_KEY.encode('utf-8')),
        modes.CBC(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plain_text.encode('utf-8')) + padder.finalize()
    
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    
    iv_b64 = base64.b64encode(iv).decode('utf-8')
    ct_b64 = base64.b64encode(ciphertext).decode('utf-8')
    
    return f"{iv_b64}:{ct_b64}"

def decrypt(cipher_text: str) -> str:
    if not cipher_text or ":" not in cipher_text:
        return cipher_text
        
    parts = cipher_text.split(":")
    if len(parts) != 2:
        return cipher_text
        
    iv = base64.b64decode(parts[0])
    ciphertext = base64.b64decode(parts[1])
    
    cipher = Cipher(
        algorithms.AES(settings.AES_SECRET_KEY.encode('utf-8')),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()
    
    unpadder = padding.PKCS7(128).unpadder()
    plain_text = unpadder.update(padded_data) + unpadder.finalize()
    
    return plain_text.decode('utf-8')
