// src/app/api/upload/image/route.js
export const runtime = 'nodejs';
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { randomUUID } from 'crypto';

// Configuration pour les uploads
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Créer le dossier d'upload s'il n'existe pas
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Erreur création dossier upload:', error);
  }
}

// Générer un nom de fichier sécurisé
function generateFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${extension}`;
}

// Valider le fichier
function validateFile(file, fileBuffer) {
  // Vérifier la taille
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: 'La taille du fichier ne doit pas dépasser 5MB' };
  }

  // Vérifier le type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.' };
  }

  // Vérification basique de la signature du fichier (magic numbers)
  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46] // Les 4 premiers bytes pour WebP
  };

  const signature = magicNumbers[file.type];
  if (signature) {
    const fileSignature = Array.from(fileBuffer.slice(0, signature.length));
    const isValidSignature = signature.every((byte, index) => fileSignature[index] === byte);
    
    if (!isValidSignature) {
      return { valid: false, error: 'Le contenu du fichier ne correspond pas à son type déclaré' };
    }
  }

  return { valid: true };
}

export async function POST(request) {
  try {
    console.log('🔄 Début de l\'upload d\'image');

    // Vérifier le Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type doit être multipart/form-data' },
        { status: 400 }
      );
    }

    // Parser les données du formulaire
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Aucun fichier image trouvé dans la requête' },
        { status: 400 }
      );
    }

    console.log('📄 Fichier reçu:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Convertir le fichier en buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Valider le fichier
    const validation = validateFile(file, fileBuffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // S'assurer que le dossier d'upload existe
    await ensureUploadDir();

    // Générer un nom de fichier unique
    const fileName = generateFileName(file.name);
    const filePath = path.join(UPLOAD_DIR, fileName);
    const publicUrl = `/uploads/images/${fileName}`;

    console.log('💾 Sauvegarde vers:', filePath);

    // Sauvegarder le fichier
    await writeFile(filePath, fileBuffer);

    console.log('✅ Image uploadée avec succès:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload d\'image:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de l\'upload de l\'image',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Optionnel: Endpoint pour supprimer une image
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

    // Sécurité: vérifier que le nom de fichier ne contient pas de caractères dangereux
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nom de fichier invalide' },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Vérifier que le fichier existe et le supprimer
    try {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      console.log('🗑️ Image supprimée:', filename);
      
      return NextResponse.json({
        success: true,
        message: 'Image supprimée avec succès'
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
    console.error('❌ Erreur lors de la suppression d\'image:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la suppression de l\'image',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}