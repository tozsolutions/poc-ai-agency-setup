# Sonraki Adımlar — PoC'den Canlıya Tam Yol Haritası

Bu dosya, "poc-ai-agency-setup" deposu için baştan sona uygulanabilir, adım adım yapılacaklar listesidir. Her adımda gereken komutlar, testler, kabul kriterleri ve açıklamalar yer alır. Adımları sırayla uygularsanız PoC'i doğrulayıp canlıya alabilirsiniz.

Not: Tüm komutlar Windows ortamı için WSL2 altında çalıştırılacak şekilde verilmiştir (masaüstü: Windows 10, laptop: Windows 11). Docker Desktop WSL2 backend ile kullanılmalıdır.

---

## Özet (tek satır)
1. Ortamı doğrula (GPU, Docker, WSL2)
2. Depoyu klonla, `.env` kopyala ve ayarları gir
3. Temel servisleri ayağa kaldır (docker-compose)
4. Model proxy ve orchestrator sağlık kontrolü yap
5. PoC: `create_video_from_prompt` endpoint ile uçtan uca test
6. n8n workflow import et ve webhook test et
7. Lokal modeller (text-gen, AUTOMATIC1111) kur ve test et
8. Remotion & TTS render testleri yap
9. Reverse tunnel (autossh) kur, VPS ile bağlantıyı doğrula
10. 3D Web UI çalıştır ve Hermes/Hermes-lite entegrasyonunu yap
11. Moderasyon, analytics ve RAG ekle (opsiyonel)
12. İlk 3 pilot videoyu private olarak yayınla, QA yap, public publish
13. Monitoring, backup & rollback politikalarını devreye al

---

## Ön Koşullar
- Masaüstü: Windows 10, WSL2 (Ubuntu 22.04), NVIDIA sürücü + WSL CUDA, Docker Desktop
- Laptop: Windows 11, WSL2, Docker Desktop
- VPS: Ubuntu 22.04 (Docker yüklü), public IP (kontrol plane)
- Telefon: Telegram hesabı (opsiyonel) — bildirimler için
- GitHub repo: `tozsolutions/poc-ai-agency-setup` (bu repo zaten başlatıldı)

Her komut adımında, hata alırsanız çıktıyı kopyalayıp destek isteyin.

---

## 1) Ortam Doğrulama (Masaüstü: GPU + Docker)
WSL2 açın (Ubuntu). Aşağıdaki komutları çalıştırın.

1.1 WSL2 versiyon kontrol

  wsl --list --verbose

1.2 NVIDIA ve Docker GPU test (WSL içinde)

  # WSL içinde
  nvidia-smi
  docker run --gpus all --rm nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

Kabul Kriteri: `nvidia-smi` çalışıyorsa GPU görünüyor; Docker konteyner içinde GPU listeleniyor.

Sorun: Eğer `nvidia-smi` yoksa NVIDIA Windows driver + WSL CUDA kurulum yönergelerini takip edin (NVIDIA docs).

---

## 2) Repo Klon & .env

2.1 Klon:

  git clone https://github.com/tozsolutions/poc-ai-agency-setup.git
  cd poc-ai-agency-setup

2.2 .env ayarı

  cp .env.example .env
  # .env içindeki gerekli alanları doldurun (özellikle N8N credentials ve ARTIFACTS_DIR)

Not: API anahtarlarını (OpenAI, HF) ilk başta boş bırakabilirsiniz; PoC yerelde çalışacak şekilde hazırlandı.

---

## 3) Temel Stack: docker compose up

Bu repo kökünde:

  docker compose up --build -d

Servisler:
- n8n (http://localhost:5678)
- model-proxy (http://localhost:4010)
- orchestrator (http://localhost:4000)
- remotion worker (render komutunu çalıştırır)

3.1 Kontroller

  docker ps
  docker logs ai-agency-orchestrator
  curl http://localhost:4000/health
  curl http://localhost:4010/health

Kabul Kriteri: Her iki health endpoint `status: ok` dönmeli.

---

## 4) Model-proxy ve Orchestrator Sağlık Kontrolü

4.1 Model-proxy health

  curl http://localhost:4010/health

4.2 Orchestrator health

  curl http://localhost:4000/health

4.3 Model generate test (placeholder / fallback)

  curl -X POST http://localhost:4010/generate -H "Content-Type: application/json" -d '{"prompt":"Test prompt for local proxy"}'

Beklenti: Eğer lokal LLM yoksa fallback template döner. Kod doğruysa `text` alanı içeren JSON gelecektir.

---

## 5) PoC: create_video_from_prompt uçtan uca test

5.1 Basit çağrı (orchestrator)

  curl -X POST http://localhost:4000/create_video_from_prompt \
    -H "Content-Type: application/json" \
    -d '{"prompt":"60 saniyelik ürün tanıtımı: Pergoclean ile yüzey temizliği", "style":"youtube-short"}'

Beklenti:
- Orchestrator model-proxy'ye script isteği gönderir
- Script `artifacts/<safe_title>/script.txt` içerisine yazılır
- Eğer Remotion render yoksa `render-deferred` yanıtı alırsınız (ilk aşamada normal)

Not: Tam render almak için Remotion doğru kurulmalı (aşağıda açıklama).

---

## 6) n8n Workflow import & test

6.1 n8n arayüzünü açın: http://localhost:5678 (kullanıcı .env ile ayarladığınız user/pass)
6.2 `n8n/workflow.json` dosyasını import edin (Workflows -> Import)
6.3 Workflow'u çalıştırın: webhook URL'yi alın ve orchestrator endpoint'i çağırın.

Test: n8n webhook tetikleyince `Call Orchestrator` node'u çalışmalı ve orchestrator tarafından işlenmelidir.

---

## 7) Lokal modeller: text-generation-webui & AUTOMATIC1111 (opsiyonel ilk etapta)

Bu adımlar masaüstünde yapılmalı (GPU gerektirir). Aşağıdakiler rehber niteliğindedir.

7.1 text-generation-webui (oobabooga)

  # WSL içinde
  git clone https://github.com/oobabooga/text-generation-webui.git
  cd text-generation-webui
  python -m pip install -r requirements.txt
  # model indirin (örn. ggml 7B) ve launch:
  python launch.py --api

7.2 AUTOMATIC1111 (Stable Diffusion webui)

  git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
  cd stable-diffusion-webui
  python launch.py --listen --api

Not: modeller büyük, indirme ve disk alanı gerektirir.

---

## 8) Remotion & TTS testleri (masaüstü)

8.1 Remotion (repo içinde `remotion/` var)

  cd remotion
  npm install
  node render.mjs

Çıktı: `remotion/output/video.mp4` veya `remotion/output/video.mp4` (Docker container çalışıyorsa `docker logs` kontrol edin)

8.2 Coqui (basit TTS)

  pip install TTS
  tts --text "Merhaba dünya" --out_path out.wav --model_name tts_models/en/ljspeech/tacotron2-DDC

Merge (FFmpeg):

  ffmpeg -i video.mp4 -i out.wav -c:v copy -c:a aac -strict experimental final_video.mp4

---

## 9) Reverse Tunnel: autossh (masüstü -> VPS)

Amaç: Masaüstünü doğrudan internete açmadan VPS üzerinden erişmek.

9.1 VPS hazırlık

- VPS üzerinde SSH açın ve bir kullanıcı (ör. `agency`) oluşturun.
- VPS firewall ile sadece gereken portları açın (SSH).

9.2 Masaüstü (WSL) autossh kur

  sudo apt update && sudo apt install -y autossh
  # bir SSH key oluşturun ve VPS'e authorized_keys olarak ekleyin

9.3 Örnek autossh komutu (WSL içinde çalıştırılacak)

  autossh -M 0 -N -o "ServerAliveInterval 60" -o "ServerAliveCountMax 3" -R 22222:localhost:22 agency@<VPS_IP>

Açıklama: VPS'den `ssh -p 22222 agency@localhost` ile masaüstünüze bağlanabilirsiniz (VPS üzerine port forward edilmiş olur).

---

## 10) 3D Web UI çalıştırma (local development)

  cd web-ui
  npm install
  npm run dev

Arayüz default Vite portunda açılır. UI Hermes/orchestrator status'larını poll edecek şekilde geliştirilmiştir.

---

## 11) İlk Uçtan Uca PoC Akışı (adım adım)
1. n8n üzerinden webhook tetikle (veya direkt orchestrator endpoint çağır)
2. Orchestrator model-proxy'yi çağırır (script oluşturma)
3. Orchestrator script'i `artifacts/` altına yazar
4. Eğer Remotion hazırsa render yapılır; değilse render deferred olur
5. Render tamamlanırsa TTS çalıştırılır
6. FFmpeg ile merge edilir
7. Artifact VPS'e veya buluta yedeklenir
8. n8n publish workflow tetiklenir (moderasyon sonrası private upload)
9. İnsan QA onayı sonrası public publish

Kabul Kriteri: private upload yapılmış ve QA onayı geçmiştir.

---

## 12) Hermes entegrasyonu (ileri adım)
- Hermes veya başka bir agent orchestrator kullanmak istersen:
  - Hermes'i VPS'e kur (kılavuzlara bakarak docker veya binary ile)
  - Ajan tanımları (research, script, visual, render, voice, publish) ekle
  - Hermes policy olarak `production windows` kuralını ekle
- Bu adım PoC üzerinde stabilite sağlandıktan sonra uygulanmalıdır.

---

## 13) Moderasyon, Analytics ve RAG (opsiyonel)
- Moderasyon: açık kaynak toxicity/detection modelleri ile otomatik tarama.
- Analytics: YouTube API veya OpenBB ile performans ölçümleri
- RAG: Chroma/FAISS ile transkript indexleme (sonraki adımda Graphify önerilir)

---

## 14) İlk Canlı Test Protokolü
1. 3 pilot video fikri hazırlayın (Research Agent)
2. PoC pipeline ile videoları üretin ve `private` olarak YouTube'a yükleyin
3. İnsan QA: ses, görüntü, altyazı, telif kontrol
4. 48 saat izleme sonrası performans değerlendirme
5. Gerekirse düzenlemeler yapıp public publish

Kabul: 3 pilot video private yayımlandı, QA onayı alındı, herhangi bir telif/etik uyarı yok.

---

## 15) İzleme, Backup ve Rollback
- İzleme: basit health endpoints + Docker container restart policy
- Yedek: `rclone` veya SCP ile önemli artefact'ları VPS'e kopyala
- Rollback: kod değişikliklerinde Git revert + `docker compose up -d --build` ile eski sürüme dön

Komut örneği (yedek):
  rclone copy remotion/output remote:ai-agency-backups/$(date +%F)

---

## 16) Hata Ayıklama (Troubleshooting) — hızlı ipuçları
- Orchestrator HTTP 500: `docker logs ai-agency-orchestrator` ile stdout/stderr kontrolü
- Model-proxy timeout: lokal LLM yoksa fallback çalışır, .env içindeki LOCAL_LLM_BASE_URL'ü kontrol et
- Remotion long renders: konteyner loglarını incele ve CPU/GPU kullanımına bakın
- Docker hataları: `docker compose down && docker compose up --build` ile yeniden başlat

---

## 17) Dosyalar / Örnek komutlar (hızlı referans)
- Başlat tüm stack:
  docker compose up --build -d

- Orchestrator health:
  curl http://localhost:4000/health

- Model proxy test:
  curl -X POST http://localhost:4010/generate -H "Content-Type: application/json" -d '{"prompt":"Test"}'

- PoC test:
  curl -X POST http://localhost:4000/create_video_from_prompt -H "Content-Type: application/json" -d '{"prompt":"Test video"}'

---

## 18) İleride eklenmesi önerilenler (roadmap)
- Hermes (veya NousResearch) tam kurulum
- Auto-scaling render farm (birden fazla masaüstü/worker)
- Advanced RAG (Graphify / Codebase memory MCP)
- CI: GitHub Actions ile deploy/test pipeline
- Güvenlik sertifikasyonu ve süreç otomasyonu

---

## Son Not
Her adımı tamamladığınızda bana sonucu gönderin; log/parça/çıktı örnekleriyle beraber ben sonraki adımı detaylandırıp repo'ya gerekli küçük düzenlemeleri yaparım. Bu dosya repoya eklendi: `docs/NEXT_STEPS.md`.
