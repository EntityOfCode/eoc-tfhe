#include <sstream>
#include <iostream>
#include <fstream>
#include <ctime>
#include <string>
#include <vector>
#include <string.h>
#include <polynomials.h>
#include <set>
#include "tfhe.h"
#include <memory>
#include "jwt/jwt_all.h"
#include <cstdlib>
#include <array>
#include <algorithm>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
// #include <emscripten/emscripten.h>
#include <stdexcept>

using json = nlohmann::json;

using namespace std;

int16_t minimum_lambda = 128;
static const int32_t Msize = (1LL << 31) - 1;
static const double alpha = 1. / (10. * Msize);

unique_ptr<TFheGateBootstrappingSecretKeySet> globalSecretKey = nullptr;
unique_ptr<TFheGateBootstrappingCloudKeySet> globalPublicKey = nullptr;
LweSample* globalString = nullptr;

// Base64 encoding function
static const std::string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

void logHeapUsage() {
    // size_t heapSize = emscripten_get_heap_size();
    // size_t freeHeapSize = emscripten_get_free_heap_size();
    // size_t usedHeapSize = heapSize - freeHeapSize;

    // std::cout << "Current heap size: " << heapSize << " bytes" << std::endl;
    // std::cout << "Free heap size: " << freeHeapSize << " bytes" << std::endl;
    // std::cout << "Used heap size: " << usedHeapSize << " bytes" << std::endl;
}

std::string base64_encode(const unsigned char *data, size_t len)
{
    std::string ret;
    int val = 0;
    int valb = -6;
    for (size_t i = 0; i < len; i++)
    {
        val = (val << 8) + data[i];
        valb += 8;
        while (valb >= 0)
        {
            ret.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6)
        ret.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (ret.size() % 4)
        ret.push_back('=');
    return ret;
}

// // Function to fetch data from a URL using the curl command-line tool
// std::string fetchUrl(const std::string &url)
// {
//     std::string command = "curl -s \"" + url + "\"";
//     std::string result;
//     std::array<char, 128> buffer;
//     std::shared_ptr<FILE> pipe(popen(command.c_str(), "r"), pclose);
//     if (!pipe)
//     {
//         throw std::runtime_error("popen() failed!");
//     }
//     while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr)
//     {
//         result += buffer.data();
//     }
//     return result;
// }

std::string base64_decode(const std::string &in)
{
    std::string out;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++)
        T["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[i]] = i;
    int val = 0, valb = -8;
    for (unsigned char c : in)
    {
        if (T[c] == -1)
            break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0)
        {
            out.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}

// Function to extract the issuer from the JWT token
std::string extractIssuer(const std::string &token)
{
    ::json header, payload;
    std::tie(header, payload) = JWT::Decode(token);
    return payload.value("iss", "");
}

// Function to convert base64url to base64
std::string base64url_to_base64(const std::string &input)
{
    std::string result = input;
    std::replace(result.begin(), result.end(), '-', '+');
    std::replace(result.begin(), result.end(), '_', '/');
    while (result.size() % 4)
    {
        result += '=';
    }
    return result;
}

// Function to get the public key from the JWKS
std::string getPublicKeyFromJWKS(const std::string &jwksBase64, const std::string &kid)
{
    std::string jwksJson = base64_decode(jwksBase64);
    // std::cout << "Parsing JWKS: " << jwksJson << std::endl;
    ::json jwks = ::json::parse(jwksJson);
    // std::cout << "Parsed json: " << jwks << std::endl;
    for (const auto &key : jwks["keys"])
    {
        // std::cout << "Key ID: " << key["kid"] << std::endl;
        if (key["kid"] == kid)
        {
            std::string n = base64url_to_base64(key["n"]);
            std::string e = base64url_to_base64(key["e"]);

            // Decode base64 to binary
            std::string n_bin = base64_decode(n);
            std::string e_bin = base64_decode(e);

            // Create RSA structure
            RSA *rsa = RSA_new();
            BIGNUM *n_bn = BN_bin2bn(reinterpret_cast<const unsigned char *>(n_bin.data()), n_bin.size(), NULL);
            BIGNUM *e_bn = BN_bin2bn(reinterpret_cast<const unsigned char *>(e_bin.data()), e_bin.size(), NULL);
            // std::cout << "Generating RSA key..." << std::endl;
            RSA_set0_key(rsa, n_bn, e_bn, NULL);

            // Convert RSA to PEM
            BIO *bio = BIO_new(BIO_s_mem());
            // std::cout << "Converting RSA to PEM..." << std::endl;
            PEM_write_bio_RSA_PUBKEY(bio, rsa);
            char *pem_data;
            long pem_len = BIO_get_mem_data(bio, &pem_data);
            std::string publicKey(pem_data, pem_len);

            // Clean up
            BIO_free(bio);
            RSA_free(rsa);

            // std::cout << "Public key: " << publicKey << std::endl;
            return publicKey;
        }
    }
    return "";
}

bool validateJWT(const std::string &token, const std::string &jwksBase64)
{
    std::cout << "Validating JWT token...:" << token << std::endl;

    try
    {
        // Step 1: Extract the issuer from the token
        std::string issuer = extractIssuer(token);
        if (issuer.empty())
        {
            std::cerr << "Issuer not found in token." << std::endl;
            return false;
        }

        // std::cout << "Issuer: " << issuer << std::endl;

        // Step 2: Decode the token to get the kid
        ::json header, payload;
        std::tie(header, payload) = JWT::Decode(token);
        std::string kid = header.value("kid", "");
        if (kid.empty())
        {
            std::cerr << "Key ID (kid) not found in token." << std::endl;
            return false;
        }

        // std::cout << "Key ID: " << kid << std::endl;

        // Step 3: Retrieve the public key from the JWKS
        std::string publicKey = getPublicKeyFromJWKS(jwksBase64, kid);
        if (publicKey.empty())
        {
            std::cerr << "Public key not found for kid: " << kid << std::endl;
            return false;
        }

        // std::cout << "Public key: " << publicKey << std::endl;

        // Step 4: Validate the token using the public key
        ExpValidator exp;
        RS256Validator signer(publicKey);
        std::tie(header, payload) = JWT::Decode(token, &signer, &exp);
        issuer = payload.value("iss", "");              // Extract the "iss" field
        std::string subject = payload.value("sub", ""); // Extract the "sub" field
        std::cout << "JWT validation successful. Issuer: " << issuer << ", Subject: " << subject << std::endl;
        return true;
    }
    catch (InvalidTokenError &tfe)
    {
        std::cout << "JWT validation failed: " << tfe.what() << std::endl;
        return false;
    }
}

LweSample *encrypt8BitASCII(string &msg, const int16_t msgLength, TFheGateBootstrappingSecretKeySet *key)
{
    LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msg.length(), key->params);
    // LweSample *temp = new_gate_bootstrapping_ciphertext_array(8 * messageLength, key->params);
    Torus32 msgT = modSwitchToTorus32(static_cast<int32_t>(msg.at(0)), Msize);
    for (int16_t i = 0; i < msgLength; i++)
    {
        msgT = modSwitchToTorus32(static_cast<int32_t>(msg.at(i)), Msize);
        lweSymEncrypt(ciphertext + i, msgT, alpha, key->lwe_key);
    }
    return ciphertext;
}

string decrypt8BitASCII(LweSample *ciphertext, const int16_t msgLength, const TFheGateBootstrappingSecretKeySet *key)
{
    Torus32 decryptedT;
    string decrypted;
    for (int16_t i = 0; i < msgLength; i++)
    {
        decryptedT = lweSymDecrypt(ciphertext + i, key->lwe_key, Msize);
        decryptedT = lwePhase(ciphertext + i, key->lwe_key);
        decrypted.push_back(static_cast<char>(modSwitchFromTorus32(decryptedT, Msize)));
    }
    return decrypted;
}

bool compareStrings(string &msg1, string &msg2)
{
    if (msg1.length() != msg2.length())
        return false;
    for (int i = 0; i < static_cast<int>(msg1.length()); i++)
    {
        if (msg1.at(i) != msg2.at(i))
            return false;
    }
    return true;
}

bool compareCiphertexts(LweSample *ciphertext1, LweSample *ciphertext2, const int16_t msgLength, const TFheGateBootstrappingSecretKeySet *key)
{
    Torus32 decryptedT1;
    Torus32 decryptedT2;
    for (int16_t i = 0; i < msgLength; i++)
    {
        decryptedT1 = lweSymDecrypt(ciphertext1 + i, key->lwe_key, Msize);
        decryptedT2 = lweSymDecrypt(ciphertext2 + i, key->lwe_key, Msize);
        if (decryptedT1 != decryptedT2)
            return false;
    }
    return true;
}


extern "C" void testJWT()
{
    logHeapUsage();
    std::cout << "Testing JWT validation using a static token and a static jwks.json" << std::endl;
    std::cout << "Short ASCII string inside job test using Hello Weavers! as demo string" << std::endl;

    string str1 = "Hello Weavers!";
    LweSample *str1Cipher = new_gate_bootstrapping_ciphertext_array(str1.length(), globalSecretKey->params);
    str1Cipher = encrypt8BitASCII(str1, str1.length(), globalSecretKey.get());

    string decryptedMsg = decrypt8BitASCII(str1Cipher, str1.length(), globalSecretKey.get());

    std::cout << "Decrypted message internal test: " << decryptedMsg << std::endl;

    std::string token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR0TU13TEllaUlDc0YtcF9SbWFidCJ9.eyJvd25lciI6IjB6c2N4OXN5aGM0YlVqY0ltcXVEb1N1M2lRdVdXYjU5WThfMzc0M195ZFlxMFVmNC1GeGpudVlqVGQ3UUFuZGNOWUlIbHJfaHptQ0ZJSVBDZDVFTThGazlLb1NId3J2LUZEOHJEV3FBdnhSRHY3MDR5ZDJ6c3VxVV9ZWEtyMlVkRk5TaktHeDNmUlg2dW1lLWw1ZjNUNnNkZnRRa2VCbVF6LTViMk1sLV8zbV9UOGViUmViN2FPbnhuOXBtUHpvNERPQ3VhRGRfQXh2R2p0QW50X2ZzdEtMZkRlMTJpWDJiTjAwNTFPQmZITXAxQ3RBUEdKU3o4LWVUZDBTcHp1OC1TcjVMOFNIZ1NFNXJMSVFnU1kxaW1jcWlldThMZGZ4X01ZbjdiWWZQZ3QwWGtyMG1lT3JmVVZ5VFAzY0tqREY0YVVPU3pXdTVub0xtdmRydUw0X2dxV0xHZ2VkSHkzdW45VG5lRzdjVXFfNjh1THhEQ0xrSGlIVTZRUWtIcEREeXYza0I5dE9OdXE0WUhZQ1EyTkxzOTdQLWFoTE1JSld3c096NGtBZFN5SUlNUm1GVnNnWl95czlRTkM2NE1GaDVQWUdhVE1TV3dNWlVqdnBVSmtjbkdybHZycDJ4MDdfMUtwRGxfWmVXVmpiRVR2Z2dwYjBuWjJxSnhOVHdqRFVETU4tS19maEJJTFJkRDNyWWxzd3I0VUtxenF6N1dEMG9KMGRISG9HTFVCbU5YUXp6dzVsRG5GS3RVaHB6UUdvMzhJMmYxdWt2M3RNRXY2ZTk3bEhNc2FpdzhhVjZtZm5vM0NpaE9peEFNemlkLWZnUHhzMS1IQlUxdWxSejhod29vc2dxd2RhcmJZcS1VZlJWSGd5aGRjSUFURi1NTVpVMUNMU0JlSV9tbHY4Iiwid2FsbGV0QWRkcmVzcyI6IjZrdml3ZWljQmVnM3k5YzVOUzJpYTU2WDdNaThIY0MyOUNYSmkxa2ZYamMiLCJhdXRoU3lzdGVtIjoiS01TIiwiZ2l2ZW5fbmFtZSI6IlN0aXJiZWkiLCJmYW1pbHlfbmFtZSI6Ik9jdGF2aWFuIiwibmlja25hbWUiOiJvY3RhdmlhbnN0aXJiZWkiLCJuYW1lIjoiU3RpcmJlaSBPY3RhdmlhbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMeEM5ODBQWlpxRGlaZzZNRXJXNWl2Nl9IRElmWkpRbkhEM1VUVklTVk5sWVJWWnBJND1zOTYtYyIsInVwZGF0ZWRfYXQiOiIyMDI0LTExLTA3VDE4OjUwOjI4LjY5MFoiLCJlbWFpbCI6Im9jdGF2aWFuc3RpcmJlaUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm90aGVudC5pby8iLCJhdWQiOiJ1WGtSbUpvSWEwTmZ6WWdZRURBZ2o2UnNzNHdSMXRJYyIsImlhdCI6MTczMTAwNTQzMywiZXhwIjoxNzMxMDQxNDMzLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2ODU0MzQ4MzAzNDY3NTMyMiIsInNpZCI6IlpQODFQTVhCTWhkcHFGVEFhMklQN0J2dzJKSE1DcXZrIiwibm9uY2UiOiJSUzQ0YzJKWlRsWXdMbUZpVFdJd1ZsaFpha3hrVjJKVE1qSTJjakZwVUc4eVdrRnBlSFF3TFVoVWRnPT0ifQ.qaxZlYXG4S80nfrNvfAqQYNJkPTzuNKsy919pllgzrv6LEhBpTwYOJkr8COc9XsIkVwddD5J6ZJYsBSzL3T8cZ9l0WDoID1S2iql20hToiDZQVWJGC5k2OMTLR3vCaQOuRTmH5ymBwA7mke-5D7JQ_y4RCkt5qCHK6ajSf7w62R0LO_jwxFcI_qlg693hRUECM-M81N4R99qfI1skh84qYm6---xvZqTFQF4aH2CLlo_ztsKZ_SX959WVHk0FHJBt5-XLui6ICFDS6sjQWA5wzSv8MMESBJ9SEREoN6T8KdlBFOEfJd8lbzBg6Eve8d_zuLEc1R3sxD-v3jq2aq1pw";
    std::string jwksBase64 = "ewogICJrZXlzIjogWwogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAidU1mZTd5MVdSWk5ydXFURjR0SXhna05fWjVQT0pQVkg3SGUxeWt6Yk8telRWbWJiNnloVE1zdzV3WE9xWEVuZXI3b19SQjRpYVk5SFdaQ2VVcVEtLWtlVkptck9tR3lXazhaM3pIXzYtaTdCbVJGSl9KWktMSFFBMmY0UVRHSG5WNHgzOFFvNVlka1h5Qm1lcFhsc3BITHdtdDZabnVzUnIyZEtkWHMzMUJMa3ZpSGdLaVlkR2pKSGdCQl9uSEhjZU9NYnF1OTZPeHRmbks2VG9mNzJGdjFzbGZyZDB3ZzQySU5IVERMN1gxdVRMaUc4ckFRSm1vTDhDRmFxaUVPQlFYUEI1NmQ0WnJMdWRXT3hPZ25xNW52YUpXaGdTNzNnY2lTUThlcDdkZWtrWHo1U3hPUkVMSE8temY0UDhtSC02c3VKYXdHSm0yQmRLRkJvejR6a2NRIiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiVHRNTXdMSWVpSUNzRi1wX1JtYWJ0IiwKICAgICAgIng1dCI6ICJNZ3FFeENhQ3RzMTVvMXJkS3lleEdoaHRBNjAiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkNBU1p6WVV4QTNaYU1BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMVdoY05Nell4TWpBek1UVXdNVFExV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVNZmU3eTFXUlpOcnVxVEY0dEl4Z2tOL1o1UE9KUFZIN0hlMXlremJPK3pUVm1iYjZ5aFRNc3c1d1hPcVhFbmVyN28vUkI0aWFZOUhXWkNlVXFRKytrZVZKbXJPbUd5V2s4WjN6SC82K2k3Qm1SRkovSlpLTEhRQTJmNFFUR0huVjR4MzhRbzVZZGtYeUJtZXBYbHNwSEx3bXQ2Wm51c1JyMmRLZFhzMzFCTGt2aUhnS2lZZEdqSkhnQkIvbkhIY2VPTWJxdTk2T3h0Zm5LNlRvZjcyRnYxc2xmcmQwd2c0MklOSFRETDdYMXVUTGlHOHJBUUptb0w4Q0ZhcWlFT0JRWFBCNTZkNFpyTHVkV094T2ducTVudmFKV2hnUzczZ2NpU1E4ZXA3ZGVra1h6NVN4T1JFTEhPK3pmNFA4bUgrNnN1SmF3R0ptMkJkS0ZCb3o0emtjUUlEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRqb3pyemJ3UTAwMDRobW9SZGtOdy9SZlpTcERBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUNEM1lhRzlTOG05M2lrdkI2NzlKbmRHRGNRMVFLWEpYMnlxQXRMd1VhSmxSaEhFYlJ0WHltM0ora0lIbzFPT0s4SkFmdGNiYlpxMzRwK3ZwMllabTJnVURUaU1RejFRUWRLVm1qQjlUbk5ZUDlqSTdiNGx1cGZ1RGVNbnRBVkFvOGI4V0NyUlFWNHZvTjg4K1h2YWdaOUgzc3Y3ZmRQSHAxbUtHamJwejl1QmtYc3VqZFFyZHZmaklTNUR6WURhZ3lUbE5ib0hRQmJiUzJiR2N6eFZoYlF6eFNPSmx2dWcvcE4zdVV1eUdvOERCNFdEdEJwYjNmU25OQWlveDFuMzNFOTNQNnpoeVBnNVFWU1FsWS9BQ1htM1VoWTVVc1JaWEV6am9BTC95bU02OGI2Qi84NU40WHlwdmUrYlVrK1p3YjlPam13YjBwVTlhelFFWHhSV1B5OD0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9LAogICAgewogICAgICAia3R5IjogIlJTQSIsCiAgICAgICJ1c2UiOiAic2lnIiwKICAgICAgIm4iOiAieS1EV0QtU1Bpbm1Bc1d0bDBUQ1Y5T3JjZHcyNGNpbUlUaUoxYnJBUW5xN0NoUkVFcVFFaDdXYmwyWjFoY1p6aV9sQm1Nd2ZjRDJ5ZlpFNUkwT2dMNnExaEk5NzlBZERKbjZCYVNBdXE4cjJ1azBLeUZGM0RiQzBGZ25SRlJ0anM5SEYzRjZhUWE5cXVrLS1LLWFjLXpLODFOdUhjaTBnQzU0bm01QTc2V3l3NEF6cHhRckE4Z2NvcnpFREd0Z2d0cDdPUEpyTFhSdFd4NUozb3o2TlBrVERHUWZueFJoUzRQSGsxbUZ3UTVRelFlbXRWS1AtRjgxQW0xX3IwTXlfRGZMVXF3Q2w3NFNPM18xTG9TanF6VllUOGZGTmhDdzJqTUlDejFEeWR5S2czT2NUUnhXVGhjQm5XbDdvc2N0NmtzSUhqYjA3OGFsWlNwU0pOTVJMT2Z3IiwKICAgICAgImUiOiAiQVFBQiIsCiAgICAgICJraWQiOiAiUjFGenA4OVBpekNySXZYZlk1SFVOIiwKICAgICAgIng1dCI6ICJFSV9DbS1WT1o5WEhKemlqYnlYLVNfY1ByUHMiLAogICAgICAieDVjIjogWwogICAgICAgICJNSUlEQVRDQ0FlbWdBd0lCQWdJSkxXRS9SUDVUTVJQT01BMEdDU3FHU0liM0RRRUJDd1VBTUI0eEhEQWFCZ05WQkFNVEUyOTBhR1Z1ZEM1MWN5NWhkWFJvTUM1amIyMHdIaGNOTWpNd016STNNVFV3TVRRMldoY05Nell4TWpBek1UVXdNVFEyV2pBZU1Sd3dHZ1lEVlFRREV4TnZkR2hsYm5RdWRYTXVZWFYwYURBdVkyOXRNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXkrRFdEK1NQaW5tQXNXdGwwVENWOU9yY2R3MjRjaW1JVGlKMWJyQVFucTdDaFJFRXFRRWg3V2JsMloxaGNaemkvbEJtTXdmY0QyeWZaRTVJME9nTDZxMWhJOTc5QWRESm42QmFTQXVxOHIydWswS3lGRjNEYkMwRmduUkZSdGpzOUhGM0Y2YVFhOXF1aysrSythYyt6SzgxTnVIY2kwZ0M1NG5tNUE3Nld5dzRBenB4UXJBOGdjb3J6RURHdGdndHA3T1BKckxYUnRXeDVKM296Nk5Qa1RER1FmbnhSaFM0UEhrMW1Gd1E1UXpRZW10VktQK0Y4MUFtMS9yME15L0RmTFVxd0NsNzRTTzMvMUxvU2pxelZZVDhmRk5oQ3cyak1JQ3oxRHlkeUtnM09jVFJ4V1RoY0JuV2w3b3NjdDZrc0lIamIwNzhhbFpTcFNKTk1STE9md0lEQVFBQm8wSXdRREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlRLeEkvZk9xU21IVTJyRVFwTTNQSVBqYVYxcVRBT0JnTlZIUThCQWY4RUJBTUNBb1F3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUlGUUhSQ0hLMGFXRmZ1cnkvM3lWZ1BjZU02T2x4Z01ySXhwcE5kY3M0N0xhZnliTFE3Z1hmaHdaTW50bGxvU2dXTm9DcWxNTDRWWnJnRkJTRkw3aHRuYTJKVmw0OUpybi9FODBIVXlXNVFZRGMxVlpPN2FuMUN6eXJmRzEvak84YUwySzE5RGFsdWxTYk1jN0ZRNURXQzZ2UEZ6eHVoOHZkYXFUSDdNbTFEMnFWS0VTNjViRWRJUkh4ck9wNWttYWJRekRkcGxjTVIwMitkdGNNY21xejg3ZG8xOFBDaHo0RjBkRTA3ekgvbEZMSWt0Smt2aXVRaW50bEt4MVB6RGhJV0JpbEI2aW5zbTM3Slo3YW9DdHdOVmE5QXFrMFYxTWxIU2J4dUt1TGlPbU52bWhPbHpsZFpnRGVRMSttd0pxajJZV3N5c1d3ODNLWkswVjBoOTBZdz0iCiAgICAgIF0sCiAgICAgICJhbGciOiAiUlMyNTYiCiAgICB9CiAgXQp9";

    bool isValid = validateJWT(token, jwksBase64);
    if (isValid)
    {
        std::cout << "Token is valid." << std::endl;
    }
    else
    {
        std::cout << "Token is invalid." << std::endl;
    }
    logHeapUsage();
}

extern "C" void info()
{
    std::cout << "TFHE Library: Enabling fully homomorphic encryption computations on encrypted data. Test Version with JWT and OpenSSL functionality." << std::endl;
}

extern "C" const char *generateSecretKey(const char *jwtToken, const char *jwksBase64)
{
    logHeapUsage();
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return nullptr;
    }

    if (!globalSecretKey)
    {
        std::cout << "Generating secret key started..." << std::endl;
        clock_t start = clock();

        TFheGateBootstrappingParameterSet *params = new_default_gate_bootstrapping_parameters(minimum_lambda);
        // unique_ptr<TFheGateBootstrappingSecretKeySet> sk_fake(new_random_gate_bootstrapping_secret_keyset(params));
        unique_ptr<TFheGateBootstrappingSecretKeySet> sk(new_random_gate_bootstrapping_secret_keyset(params));
        unique_ptr<TFheGateBootstrappingCloudKeySet> pk(const_cast<TFheGateBootstrappingCloudKeySet *>(&sk->cloud));
        globalSecretKey = std::move(sk);
        globalPublicKey = std::move(pk);
        std::ostringstream oss;
        export_tfheGateBootstrappingSecretKeySet_toStream(oss, globalSecretKey.get());
        std::string encodedKey = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        clock_t end = clock();
        std::cout << "Generating secret key finished, started at: " << start << " ended at " << end << " completed in " << (end - start) << " ms" << std::endl;
        // Allocate memory on the heap for the encoded key
        char *encodedKeyCStr = new char[encodedKey.size() + 1];
        std::strcpy(encodedKeyCStr, encodedKey.c_str());
        logHeapUsage();
        return encodedKeyCStr;
    }
    else
    {
        std::cout << "Secret key is already generated for this instance..." << std::endl;
        return nullptr;
    }
}

extern "C" char *generatePublicKey()
{
    /* temporary don't need it */
    /*
    std::cout << "Generating public key started..." << std::endl;
    clock_t start = clock();

    if (!globalSecretKey)
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }

    unique_ptr<TFheGateBootstrappingCloudKeySet> pk(const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud));
    globalPublicKey = std::move(pk);//const_cast<TFheGateBootstrappingCloudKeySet *>(&globalSecretKey->cloud);

    std::ostringstream oss;
    export_tfheGateBootstrappingCloudKeySet_toStream(oss, globalPublicKey.get());
    std::string encodedKey = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

    char *msg = (char *)malloc(encodedKey.size() + 1);
    if (msg == nullptr)
    {
        return nullptr;
    }
    strcpy(msg, encodedKey.c_str());

    clock_t end = clock();
    std::cout << "Generating public key completed in " << (end - start) / CLOCKS_PER_SEC * 1000 << " ms" << std::endl;
    */
    return nullptr;
}

extern "C" const char *encryptInteger(int value, const char *base64Key)
{
    logHeapUsage();
    std::cout << "Encrypting integer " << value << " started..." << std::endl;
    clock_t start = clock();

    if (globalSecretKey)
    {
        // Encryption
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        Torus32 torusValue = modSwitchToTorus32(value, Msize);
        lweSymEncrypt(ciphertext, torusValue, alpha, globalSecretKey.get()->lwe_key);

        // Export the ciphertext to a stringstream in order to encode it in base64
        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertext, globalSecretKey.get()->params->in_out_params);
        std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());
        std::cout << "oss.str().size(): " << oss.str().size() << std::endl;
        std::cout << "Encrypted integer ciphertext length/size: " << encodedCiphertext.length() << "/" << encodedCiphertext.size() << std::endl;
        std::cout << "Encrypted integer ciphertext: " << encodedCiphertext << std::endl;


        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting integer completed in " << (end - start) << " ms" << std::endl;
        char *encodedCipherStr = new char[encodedCiphertext.size() + 1];
        std::strcpy(encodedCipherStr, encodedCiphertext.c_str());
        logHeapUsage();
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *encryptInteger_dummy(int value, const char *base64Key)
{
    logHeapUsage();
    std::cout << "Encrypting integer DUMMY DUMMY DUMMY " << value << " started..." << std::endl;
    clock_t start = clock();

    if (globalSecretKey)
    {
        // Encryption
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        Torus32 torusValue = modSwitchToTorus32(value, Msize);
        lweSymEncrypt(ciphertext, torusValue, alpha, globalSecretKey.get()->lwe_key);

        // Export the ciphertext to a stringstream in order to encode it in base64
        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertext, globalSecretKey.get()->params->in_out_params);
        std::string encodedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());
        std::cout << "Encrypted string ciphertext length/size: " << encodedCiphertext.length() << "/" << encodedCiphertext.size() << std::endl;
        std::cout << "Encrypted string ciphertext: " << encodedCiphertext << std::endl;

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting integer completed in " << (end - start) << " ms" << std::endl;
        char *encodedCipherStr = new char[encodedCiphertext.size() + 1];
        std::strcpy(encodedCipherStr, encodedCiphertext.c_str());
        logHeapUsage();
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const int decryptInteger(char *base64Ciphertext, const char *base64Key, const char *jwtToken, const char *jwksBase64)
{
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return -1;
    }
    std::cout << "Decrypting integer started..." << std::endl;
    clock_t start = clock();
    
    if (globalSecretKey)
    {
        std::string decodedCiphertext = base64_decode(base64Ciphertext);
        std::istringstream issCiphertext(decodedCiphertext);

        LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        import_lweSample_fromStream(issCiphertext, ciphertext, globalSecretKey.get()->params->in_out_params);

        Torus32 decryptedTorus = lweSymDecrypt(ciphertext, globalSecretKey.get()->lwe_key, Msize);
        int decryptedValue = modSwitchFromTorus32(decryptedTorus, Msize);

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Decrypting " << decryptedValue << " integer completed in " << (end - start) << " ms" << std::endl;
        return decryptedValue;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return -1;
    }
}

extern "C" const char *addCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
    std::cout << "Adding ciphertexts started..." << std::endl;

    clock_t start = clock();
    if (globalPublicKey)
    {
        std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
        std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);


        std::istringstream iss1(decodedCiphertext1);
        std::istringstream iss2(decodedCiphertext2);

        LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertextSum = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);

        import_lweSample_fromStream(iss1, ciphertext1, globalSecretKey.get()->params->in_out_params);
        import_lweSample_fromStream(iss2, ciphertext2, globalSecretKey.get()->params->in_out_params);

        lweCopy(ciphertextSum, ciphertext1, globalSecretKey.get()->params->in_out_params);
        lweAddTo(ciphertextSum, ciphertext2, globalSecretKey.get()->params->in_out_params);
        delete_gate_bootstrapping_ciphertext(ciphertext1);
        delete_gate_bootstrapping_ciphertext(ciphertext2);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertextSum, globalSecretKey.get()->params->in_out_params);
        delete_gate_bootstrapping_ciphertext(ciphertextSum);
        std::string encodedCiphertextSum = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        char *encodedCipherStr = new char[encodedCiphertextSum.size() + 1];
        std::strcpy(encodedCipherStr, encodedCiphertextSum.c_str());

        clock_t end = clock();
        std::cout << "Adding ciphertexts completed in " << (end - start) << " ms" << std::endl;
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Public key not initialized. Generate the public key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *subtractCiphertexts(const char *base64Ciphertext1, const char *base64Ciphertext2, const char *base64PublicKey)
{
   clock_t start = clock();
    if (globalPublicKey)
    {
        std::string decodedCiphertext1 = base64_decode(base64Ciphertext1);
        std::string decodedCiphertext2 = base64_decode(base64Ciphertext2);

        std::istringstream iss1(decodedCiphertext1);
        std::istringstream iss2(decodedCiphertext2);

        LweSample *ciphertext1 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertext2 = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        LweSample *ciphertextSub = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);

        import_lweSample_fromStream(iss1, ciphertext1, globalSecretKey.get()->params->in_out_params);
        import_lweSample_fromStream(iss2, ciphertext2, globalSecretKey.get()->params->in_out_params);

        lweCopy(ciphertextSub, ciphertext1, globalSecretKey.get()->params->in_out_params);
        lweSubTo(ciphertextSub, ciphertext2, globalSecretKey.get()->params->in_out_params);

        delete_gate_bootstrapping_ciphertext(ciphertext1);
        delete_gate_bootstrapping_ciphertext(ciphertext2);

        std::ostringstream oss;
        export_lweSample_toStream(oss, ciphertextSub, globalSecretKey.get()->params->in_out_params);
        delete_gate_bootstrapping_ciphertext(ciphertextSub);
        std::string encodedCiphertextSub = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());

        char *encodedCipherStr = new char[encodedCiphertextSub.size() + 1];
        std::strcpy(encodedCipherStr, encodedCiphertextSub.c_str());

        clock_t end = clock();
        std::cout << "Subtracting ciphertexts completed in " << (end - start) << " ms" << std::endl;
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Public key not initialized. Generate the public key first." << std::endl;
        return nullptr;
    }
}
/* put aside for further investigation  */

extern "C" const char *encrypt8BitASCIIString(const char *base64Ciphertext, const int16_t msgLength, const char *base64Key)
{
    
    clock_t start = clock();

    if (globalSecretKey)
    {
        // Encryption
        std::string decodedCiphertext(base64Ciphertext);
        std::cout << "Encrypting 8bit ASCII String " << decodedCiphertext << " started..." << std::endl;
        std::cout << "Decoded ciphertext length: " << decodedCiphertext.length() << " Message length: " << msgLength << std::endl;
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        globalString = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        // LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        // Torus32 msgT = modSwitchToTorus32(static_cast<int32_t>(asciiMessage.at(0)), Msize);
        // Export the ciphertext to a stringstream in order to encode it in base64
        std::ostringstream oss;
        std::cout << "oss stream size: " << oss.str().size() << std::endl;

        globalString = encrypt8BitASCII(decodedCiphertext, msgLength, globalSecretKey.get());
  
        // Copy the data from ciphertext to globalString
        for (int i = 0; i < msgLength; ++i) {
            export_lweSample_toStream(oss, globalString+i, globalSecretKey.get()->params->in_out_params);
            std::cout << "oss stream size: " << oss.str().size() << std::endl;
        }
        std::string encryptedCiphertext = base64_encode(reinterpret_cast<const unsigned char *>(oss.str().data()), oss.str().size());
        std::cout << "Encrypted string ciphertext length/size: " << encryptedCiphertext.length() << "/" << encryptedCiphertext.size() << std::endl;
        std::cout << "Encrypted string ciphertext: " << encryptedCiphertext << std::endl;

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Encrypting 8bit ASCII string completed in " << (end - start) << " ms" << std::endl;
        char encodedCipherStr[encryptedCiphertext.size()+ 1];// = new char[encryptedCiphertext.size()+ 1];
        std::strcpy(encodedCipherStr, encryptedCiphertext.c_str());
        return encodedCipherStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

extern "C" const char *decrypt8BitASCIIString(char *base64Ciphertext, const int16_t msgLength, const char *base64Key, const char *jwtToken, const char *jwksBase64)
{
    std::cout << "Decrypting ASCII string started..." << std::endl;
    
    if (!validateJWT(jwtToken, jwksBase64))
    {
        std::cerr << "Invalid JWT token. Exiting..." << std::endl;
        return nullptr;
    }
    
    clock_t start = clock();
    
    if (globalSecretKey)
    {
        std::string decodedCiphertext = base64_decode(base64Ciphertext);
        std::istringstream issCiphertext(decodedCiphertext);
        std::cout << "Decoded ciphertext length: " << decodedCiphertext.length() << " Message length: " << msgLength << std::endl;
        std::cout << "issCiphertext stream size: " << issCiphertext.str().size() << std::endl;
        LweSample *ciphertext = new_gate_bootstrapping_ciphertext_array(msgLength, globalSecretKey.get()->params);
        // LweSample *ciphertext = new_gate_bootstrapping_ciphertext(globalSecretKey.get()->params);
        for (int i = 0; i < msgLength; ++i) {
            import_lweSample_fromStream(issCiphertext, ciphertext+i, globalSecretKey.get()->params->in_out_params);
        }
        std::string decryptedValue = decrypt8BitASCII(ciphertext, msgLength, globalSecretKey.get());

    std::cout << "Decrypting ... " << decryptedValue << std::endl;
    string decryptedMsg = decrypt8BitASCII(globalString, msgLength, globalSecretKey.get());

    std::cout << "Decrypted message: " << decryptedMsg << std::endl;
    // for (int16_t i = 0; i < msgLength; i++)
    // {
    //     Torus32 decryptedTorus = lweSymDecrypt(ciphertext, globalSecretKey.get()->lwe_key, Msize);
    //     decryptedTorus = lwePhase(ciphertext+i*decodedCiphertext.length()/msgLength, globalSecretKey.get()->lwe_key);
    //     decryptedValue.push_back(static_cast<char>(modSwitchFromTorus32(decryptedTorus, Msize)));
    //     std::cout << decryptedValue << std::endl;
    //     // ciphertext = ciphertext+decodedCiphertext.length()/msgLength;
    // }

        delete_gate_bootstrapping_ciphertext(ciphertext);

        clock_t end = clock();
        std::cout << "Decrypting " << decryptedValue << " ascii string completed in " << (end - start) << " ms" << std::endl;
        char *decryptedValueCStr = new char[decryptedValue.size() + 1];
        std::strcpy(decryptedValueCStr, decryptedValue.c_str());
        return decryptedValueCStr;
    }
    else
    {
        std::cerr << "Secret key not initialized. Generate the secret key first." << std::endl;
        return nullptr;
    }
}

