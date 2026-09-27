// ตัวละคร 3D แบบ VRM (มาตรฐานเดียวกับ VTuber) — รันในเครื่องล้วน ๆ ผ่าน three.js
// ปากขยับตามระดับเสียงพูดจริง (audio-bus) กะพริบตา โยกตัวเบา ๆ ให้ดูมีชีวิต

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import { getSpeechVolume } from '../services/audio-bus'

interface Props {
  vrmUrl: string
  speaking: boolean
  size?: number
  className?: string
}

export default function VrmAvatar({ vrmUrl, speaking, size = 260, className = '' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const speakingRef = useRef(speaking)
  speakingRef.current = speaking

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = size
    const height = Math.round(size * 1.2)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0) // พื้นหลังโปร่งใส กลืนกับฉากบทเรียน
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20)

    const light = new THREE.DirectionalLight(0xffffff, Math.PI * 0.9)
    light.position.set(0.5, 1.2, 1.5)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xfff4e0, Math.PI * 0.45))

    let vrm: VRM | null = null
    let disposed = false
    let raf = 0
    const clock = new THREE.Clock()

    // สถานะ animation
    let mouth = 0
    let blink = 0
    let nextBlinkAt = 1.5 + Math.random() * 2

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    loader.load(
      vrmUrl,
      (gltf) => {
        if (disposed) return
        vrm = gltf.userData.vrm as VRM
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)
        // โมเดล VRM0 หันหลังให้กล้อง ต้องหมุนก่อน
        VRMUtils.rotateVRM0(vrm)
        scene.add(vrm.scene)

        // เอาแขนลงจากท่า T-pose
        const humanoid = vrm.humanoid
        const lArm = humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rArm = humanoid?.getNormalizedBoneNode('rightUpperArm')
        if (lArm) lArm.rotation.z = 1.15
        if (rArm) rArm.rotation.z = -1.15

        // จัดกล้องให้เห็นช่วงหัว-ไหล่ (เผื่อพื้นที่เหนือหัวไม่ให้ผมโดนตัด)
        const head = humanoid?.getNormalizedBoneNode('head')
        const headPos = new THREE.Vector3(0, 1.4, 0)
        head?.getWorldPosition(headPos)
        camera.position.set(headPos.x, headPos.y + 0.04, headPos.z + 0.78)
        camera.lookAt(headPos.x, headPos.y - 0.05, headPos.z)
      },
      undefined,
      () => {
        /* โหลดไม่สำเร็จ — ปล่อยเป็นกรอบว่าง (TutorAvatar มี fallback การ์ตูนอยู่แล้ว) */
      },
    )

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const t = clock.elapsedTime

      if (vrm) {
        const em = vrm.expressionManager

        // ปาก: ตามระดับเสียงจริง — ถ้าใช้เสียงระบบ (ไม่ผ่าน audio-bus) ใช้คลื่นจำลองแทน
        let target = 0
        if (speakingRef.current) {
          const vol = getSpeechVolume()
          target = vol > 0.03 ? Math.min(1, vol * 2.4) : (Math.sin(t * 13) + 1) * 0.3
        }
        mouth += (target - mouth) * Math.min(1, delta * 14)
        em?.setValue('aa', mouth)

        // กะพริบตาเป็นจังหวะสุ่ม
        if (t >= nextBlinkAt) {
          blink = 1
          nextBlinkAt = t + 2 + Math.random() * 3
        }
        if (blink > 0) {
          blink = Math.max(0, blink - delta * 9)
          em?.setValue('blink', Math.sin(Math.min(1, 1 - blink) * Math.PI))
        }

        // โยกหัว/ตัวเบา ๆ ให้ดูมีชีวิต
        const head = vrm.humanoid?.getNormalizedBoneNode('head')
        const spine = vrm.humanoid?.getNormalizedBoneNode('spine')
        if (head) {
          head.rotation.y = Math.sin(t * 0.6) * 0.05
          head.rotation.x = Math.sin(t * 0.9) * 0.025
          head.rotation.z = Math.sin(t * 0.4) * 0.02
        }
        if (spine) spine.rotation.z = Math.sin(t * 0.5) * 0.012

        vrm.update(delta)
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      if (vrm) VRMUtils.deepDispose(vrm.scene)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vrmUrl, size])

  return (
    <div
      ref={mountRef}
      className={`overflow-hidden rounded-3xl bg-gradient-to-b from-[#2e3d63] to-[#1a2440] shadow-2xl ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: Math.round(size * 1.2) }}
    />
  )
}
