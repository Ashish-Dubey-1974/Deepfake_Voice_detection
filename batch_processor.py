import os
import argparse
import json
import pandas as pd
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed
from app import DeepfakeDetector, convert_audio

def process_single_file(file_path, detector):
    """Process a single audio file and return the detection result."""
    try:
        # Convert audio to the required format
        processed_audio = convert_audio(file_path)
        
        # Detect if it's a deepfake
        result = detector.detect(processed_audio)
        
        # Add the file path to the result
        result["file_path"] = file_path
        result["file_name"] = os.path.basename(file_path)
        
        # Clean up temporary files if needed
        if processed_audio != file_path:
            try:
                os.remove(processed_audio)
            except:
                pass
        
        return result
    except Exception as e:
        return {
            "file_path": file_path,
            "file_name": os.path.basename(file_path),
            "error": str(e)
        }

def process_directory(directory_path, output_format='json', max_workers=None, recursive=False):
    """Process all audio files in a directory."""
    # Initialize the detector
    detector = DeepfakeDetector()
    
    # Find all audio files
    audio_extensions = ('.wav', '.mp3', '.ogg', '.flac')
    audio_files = []
    
    if recursive:
        for root, _, files in os.walk(directory_path):
            for file in files:
                if file.lower().endswith(audio_extensions):
                    audio_files.append(os.path.join(root, file))
    else:
        audio_files = [os.path.join(directory_path, f) for f in os.listdir(directory_path) 
                      if f.lower().endswith(audio_extensions)]
    
    if not audio_files:
        print(f"No audio files found in {directory_path}")
        return
    
    print(f"Found {len(audio_files)} audio files to process")
    
    # Process files with a progress bar
    results = []
    
    # Use parallel processing for faster analysis
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_single_file, file, detector): file for file in audio_files}
        
        for future in tqdm(as_completed(futures), total=len(audio_files), desc="Processing audio files"):
            result = future.result()
            results.append(result)
    
    # Save results based on output format
    if output_format == 'json':
        output_file = os.path.join(directory_path, "deepfake_detection_results.json")
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {output_file}")
    
    elif output_format == 'csv':
        output_file = os.path.join(directory_path, "deepfake_detection_results.csv")
        df = pd.DataFrame(results)
        df.to_csv(output_file, index=False)
        print(f"Results saved to {output_file}")
    
    # Print summary
    total = len(results)
    real_count = sum(1 for r in results if 'prediction' in r and r['prediction'] == 'Real')
    fake_count = sum(1 for r in results if 'prediction' in r and r['prediction'] == 'Deepfake')
    error_count = sum(1 for r in results if 'error' in r)
    
    print("\nSummary:")
    print(f"Total files processed: {total}")
    print(f"Detected as real: {real_count} ({real_count/total*100:.1f}%)")
    print(f"Detected as deepfake: {fake_count} ({fake_count/total*100:.1f}%)")
    print(f"Errors during processing: {error_count} ({error_count/total*100:.1f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Batch process audio files for deepfake detection')
    parser.add_argument('directory', help='Directory containing audio files to process')
    parser.add_argument('--format', choices=['json', 'csv'], default='json', help='Output format (default: json)')
    parser.add_argument('--workers', type=int, default=None, help='Number of worker processes (default: CPU count)')
    parser.add_argument('--recursive', action='store_true', help='Search for audio files recursively in subdirectories')
    
    args = parser.parse_args()
    
    process_directory(args.directory, args.format, args.workers, args.recursive)