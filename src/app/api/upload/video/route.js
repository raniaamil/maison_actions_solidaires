// src/app/api/upload/video/route.js
export const runtime = 'nodejs';
import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { randomUUID } from 'crypto';

// Configuration pour les uploads vidéo
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'videos');
// Ajuste la limite si besoin (attention aux hébergeurs). 50 Mo par défaut.
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

// Créer le dossier d'upload s'il n'existe pas
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Erreur création dossier upload vidéo:', error);
  }
}

// Générer un nom de fichier sécurisé
function generateFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${extension}`;
}

// Valider le fichier vidéo (taille, mime, signature rapide)
function validateFile(file, fileBuffer) {
  // Taille
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: `La taille de la vidéo ne doit pas dépasser ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB` };
  }

  // Type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez MP4, WebM ou Ogg.' };
  }

  // Signatures (vérifications simples & non exhaustives)
  // MP4: "ftyp" à l’offset 4
  // WebM: 0x1A 0x45 0xDF 0xA3 (EBML) au début
  // Ogg: "OggS" au début
  const buf = fileBuffer;
  const ascii = (start, len) => buf.slice(start, start + len).toString('ascii');

  if (file.type === 'video/mp4') {
    const brand = ascii(4, 4);
    if (brand !== 'ftyp') {
      return { valid: false, error: 'Signature MP4 invalide (ftyp manquant).' };
    }
  } else if (file.type === 'video/webm') {
    const sig = [0x1A, 0x45, 0xDF, 0xA3];
    const ok = sig.every((b, i) => buf[i] === b);
    if (!ok) {
      return { valid: false, error: 'Signature WebM invalide.' };
    }
  } else if (file.type === 'video/ogg') {
    if (ascii(0, 4) !== 'OggS') {
      return { valid: false, error: 'Signature Ogg invalide.' };
    }
  }

  return { valid: true };
}

export async function POST(request) {
  try {
    console.log('🔄 Début de l\'upload de vidéo');

    // Vérifier le Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type doit être multipart/form-data' },
        { status: 400 }
      );
    }

    // Parser le formulaire
    const formData = await request.formData();
    const file = formData.get('video');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Aucun fichier vidéo trouvé dans la requête (champ "video")' },
        { status: 400 }
      );
    }

    console.log('📄 Fichier vidéo reçu:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Validation
    const validation = validateFile(file, fileBuffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Dossier
    await ensureUploadDir();

    // Nom + chemins
    const fileName = generateFileName(file.name);
    const filePath = path.join(UPLOAD_DIR, fileName);
    const publicUrl = `/uploads/videos/${fileName}`;

    console.log('💾 Sauvegarde vidéo vers:', filePath);
    await writeFile(filePath, fileBuffer);

    console.log('✅ Vidéo uploadée avec succès:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload de vidéo:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur lors de l\'upload de la vidéo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Suppression d’une vidéo
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Nom de fichier requis' },
        { status: 400 }
      );
    }

    // Sanitize
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    try {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      console.log('🗑️ Vidéo supprimée:', filename);

      return NextResponse.json({
        success: true,
        message: 'Vidéo supprimée avec succès'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Fichier non trouvé' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de vidéo:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la suppression de la vidéo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
