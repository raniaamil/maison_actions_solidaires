// src/app/api/upload/image/route.js
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BUCKET = 'images';

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
    return { valid: false, error: 'La taille du fichier ne doit pas dépasser 5MB' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.' };
  }

  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
  };
  const signature = magicNumbers[file.type];
  if (signature) {
    const fileSignature = Array.from(fileBuffer.slice(0, signature.length));
    if (!signature.every((byte, i) => fileSignature[i] === byte)) {
      return { valid: false, error: 'Le contenu du fichier ne correspond pas à son type déclaré' };
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
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier image trouvé dans la requête' }, { status: 400 });
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

    console.log('✅ Image uploadée:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('❌ Erreur upload image:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload de l\'image', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
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

    return NextResponse.json({ success: true, message: 'Image supprimée avec succès' });

  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de l\'image', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
