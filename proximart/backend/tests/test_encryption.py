from app.utils.encryption import encrypt, decrypt

def test_encrypt_decrypt():
    original = "secret_phone_number_123"
    cipher_text = encrypt(original)
    
    assert cipher_text != original
    assert ":" in cipher_text
    
    decrypted = decrypt(cipher_text)
    assert decrypted == original

def test_encrypt_different_iv():
    original = "hello world"
    cipher1 = encrypt(original)
    cipher2 = encrypt(original)
    
    assert cipher1 != cipher2
    assert decrypt(cipher1) == original
    assert decrypt(cipher2) == original

def test_encrypt_none_empty():
    assert encrypt(None) is None
    assert encrypt("") == ""
    assert decrypt(None) is None
    assert decrypt("") == ""

def test_decrypt_wrong_key(monkeypatch):
    from app.config import settings
    from cryptography.exceptions import InvalidSignature
    import base64
    
    original = "hello world"
    cipher_text = encrypt(original)
    
    # Monkeypatch key for decrypt to cause error
    monkeypatch.setattr(settings, "AES_SECRET_KEY", "wrongkey123456789012345678901234")
    
    # Decryption should fail due to padding/MAC error
    import pytest
    with pytest.raises(Exception):
        decrypt(cipher_text)
