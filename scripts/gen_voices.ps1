Add-Type -AssemblyName System.Speech

function Export-Voice {
    param(
        [string]$text,
        [string]$voiceName,
        [int]$rate,
        [string]$outFile
    )
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    if ($voiceName) {
        $synth.SelectVoice($voiceName)
    }
    $synth.Rate = $rate
    $synth.SetOutputToWaveFile($outFile)
    $synth.Speak($text)
    $synth.Dispose()
}

$dir = "$PSScriptRoot\raw_voices"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory $dir }

Export-Voice -text "Waduh, napas gue abis! Pocong zaman now larinya kenceng bener kayak atlet!" -voiceName "Microsoft David Desktop" -rate -1 -outFile "$dir\pak_rt.wav"
Export-Voice -text "Udah Pak R T, ngopi tubruk dulu, sambil makan pisang goreng!" -voiceName "Microsoft David Desktop" -rate 1 -outFile "$dir\hansip.wav"
Export-Voice -text "Daaa warga kampung! Makasih yaa udah diajak senam malam! Asik, tarik sis, semongko!" -voiceName "Microsoft David Desktop" -rate 2 -outFile "$dir\pociman.wav"
Export-Voice -text "Hihihihi... Hihihihi... Besok malam ronda lagi yaa mas-mas hansip!" -voiceName "Microsoft Zira Desktop" -rate 1 -outFile "$dir\kunti.wav"

Write-Host "Voices generated successfully in $dir"
