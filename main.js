const { createClient } = supabase;

const supabaseClient = createClient(
  "https://qngixdibqzxarqpoqypz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2l4ZGlicXp4YXJxcG9xeXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTY2NDMsImV4cCI6MjA2Mzk5MjY0M30.a-LJ2EcgzuNm7K_9k_GH5C0ognKVIlXU-aSASE-2rcM" // potong untuk keamanan publik
);

const bucketName = "dokumen";

// Cek session login
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (!session?.user) {
    window.location.href = "login.html";
  } else {
    loadGallery(session.user.id);
  }
});

// Upload file
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    document.getElementById("status").innerText = "Pilih file dulu ya!";
    return;
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const user = session?.user;
  if (!user) {
    document.getElementById("status").innerText = "Harus login dulu!";
    return;
  }

  const filePath = `${user.id}/${Date.now()}_${file.name}`;

  const { error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    document.getElementById("status").innerText =
      "Upload gagal: " + error.message;
  } else {
    document.getElementById("status").innerText = "Upload berhasil!";
    loadGallery(user.id);
  }
}

// Tampilkan galeri gambar
async function loadGallery(userId) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const { data: files, error } = await supabaseClient.storage
    .from(bucketName)
    .list(userId, { limit: 100 });

  if (error) {
    document.getElementById("status").innerText =
      "Gagal ambil file: " + error.message;
    return;
  }

  for (const file of files) {
    const fullPath = `${userId}/${file.name}`;

    const { data: signedUrlData } = await supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(fullPath, 10);

    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";

    const img = document.createElement("img");
    img.src = signedUrlData?.signedUrl;

    const delBtn = document.createElement("button");
    delBtn.innerText = "×";
    delBtn.className = "delete-btn";
    delBtn.onclick = async () => {
      if (!confirm("Yakin hapus gambar ini?")) return;

      const { error } = await supabaseClient.storage
        .from(bucketName)
        .remove([fullPath]);

      if (error) {
        alert("Gagal hapus gambar: " + error.message);
      } else {
        alert("Gambar dihapus.");
        loadGallery(userId);
      }
    };

    wrapper.appendChild(img);
    wrapper.appendChild(delBtn);
    gallery.appendChild(wrapper);
  }
}

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
// Fungsi untuk menampilkan gambar fullscreen
document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  document.body.addEventListener('click', function (e) {
    if (e.target.matches('.gallery-grid img')) {
      lightboxImg.src = e.target.src;
      lightbox.style.display = 'flex';
    }
  });
});

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}

