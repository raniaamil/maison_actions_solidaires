// src/app/api/upload/video/route.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const BUCKET = 'videos';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return createClient(url, key);
}

function generateFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${extension}`;
}

function validateFile(file, fileBuffer) {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: `La taille de la vidéo ne doit pas dépasser ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB` };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez MP4, WebM ou Ogg.' };
  }

  const buf = fileBuffer;
  const ascii = (start, len) => buf.slice(start, start + len).toString('ascii');

  if (file.type === 'video/mp4') {
    if (ascii(4, 4) !== 'ftyp') {
      return { valid: false, error: 'Signature MP4 invalide (ftyp manquant).' };
    }
  } else if (file.type === 'video/webm') {
    const sig = [0x1A, 0x45, 0xDF, 0xA3];
    if (!sig.every((b, i) => buf[i] === b)) {
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
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type doit être multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('video');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier vidéo trouvé dans la requête (champ "video")' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const validation = validateFile(file, fileBuffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const fileName = generateFileName(file.name);
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erreur Supabase Storage:', uploadError);
      return NextResponse.json({ error: 'Erreur lors de l\'upload vers le stockage' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    console.log('✅ Vidéo uploadée:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('❌ Erreur upload vidéo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload de la vidéo', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Nom de fichier requis' }, { status: 400 });
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET).remove([filename]);

    if (error) {
      console.error('❌ Erreur suppression Supabase:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Vidéo supprimée avec succès' });

  } catch (error) {
    console.error('❌ Erreur suppression vidéo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de la vidéo', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
