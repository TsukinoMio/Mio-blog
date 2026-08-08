---
title: '基于物理的渲染（PBR）学习笔记'
date: '2026-08-06'
summary: '整理 PBR 渲染管线里绕不开的几个概念：辐射度量学、BRDF、Cook-Torrance 模型的三大项（法线分布、几何函数、菲涅尔反射），附一份 Unity HLSL 的直接光实现。'
category: '图形学'
tags: ['图形学', 'PBR', 'Shader']
cover: '/images/blog/pbr-notes/01-rendering-overview.png'
draft: false
---

参考：

- [【基于物理的渲染（PBR）白皮书】（一） 开篇：PBR核心知识体系总结与概览](https://zhuanlan.zhihu.com/p/53086060)
- [Physically Based Rending in Filament](https://google.github.io/filament/Filament.md.html#materialsystem/anisotropicmodel)
- [直言不会系列：PBR](https://zhuanlan.zhihu.com/p/1991250466483480017)
- [【技术美术】光照技术概述](https://bdffzi-blog.netlify.app/posts/2656087290)
- [呆呆兽也可以学会的PBR渲染.上](https://zhuanlan.zhihu.com/p/2005956500745652011)

---

# 渲染方程

$$
L_o(p, \omega_o) = \int_{\Omega} f_r(p, \omega_i, \omega_o) L_i(p, \omega_i) \max(0, \mathbf{n} \cdot \omega_i) d\omega_i
$$

## 辐射率与辐照度

这是两个很容易搞混的概念。

辐射率（Radiance，L）指沿着一束特定方向/光线传播的光的能量，摄像机看到的光其实就是辐射率，在渲染方程中指代出射辐射率 $L_o(p, \omega_o)$ 和入射辐射率 $L_i(p, \omega_i)$。

辐照度（Irradiance，E）指表面某一点接收到的来自整个半球面所有方向的光的总能量，在渲染方程中指代 $\int_{\Omega} L_i(p, \omega_i) \max(0, \mathbf{n} \cdot \omega_i) d\omega_i$。

# 双向反射分布函数

双向反射分布函数（Bidirectional Reflectance Distribution Function，BRDF），描述一个方向的光如何反射到观察方向的函数，BRDF 描述的是从入射光转换到反射光的过程，这个过程受材质的粗糙度、金属度、反照率等属性的影响。

目前常用的 BRDF 为 Cook-Torrance，在实时渲染中广泛使用。

BRDF 有很多种模型，常见的如下表：

| 模型 | 模型分类 | 主要用途 |
| :--- | :--- | :--- |
| Lambert | 经验模型 | 早期 3D 渲染 |
| Blinn-Phong | 经验模型 | 高性能的传统着色模型 |
| Cook-Torrance | 物理模型 | 主流 PBR 模型基础 |
| GGX | 物理模型 | 用于电影或 3A 游戏 |
| Disney BRDF | 物理模型 | 电影 |
| BSSRDF | 物理模型 | 皮肤渲染 |
| … | … | … |

![渲染方程与光照模型概览](/images/blog/pbr-notes/01-rendering-overview.png)

# Cook-Torrance BRDF / 直接光

## 能量守恒

<Note type="tip">能量守恒（Energy Conservation）：出射光线的能量永远不能超过入射光线的能量（发光面除外）。</Note>

Phong 模型由漫反射项和高光项构成，但是 Phong 模型叠加了高光和漫反射部分，导致即使在高光强度很高的地方，仍然叠加了一个漫反射光的强度值，下图左为 URP 默认材质，右为 Blinn-Phong 模型：

![URP 默认材质与 Blinn-Phong 模型对比](/images/blog/pbr-notes/02-urp-vs-blinnphong.png)

Blinn-Phong 的高光强度明显超出了预期，高光变强时，漫反射应该减少，Blinn-Phong 不符合能量守恒。

我们需要用一个参数来控制漫反射的部分，另一个参数来控制高光部分，以达到能量守恒。我们用 $K_d$ 来表示漫反射部分，$K_s$ 来表示高光部分，则 Cook-Torrance BRDF 可以先写成：

$$
f_r = K_d \cdot lambert + K_s \cdot specular
$$

其中漫反射部分为：

$$
lambert = \frac{c}{\pi}
$$

c 为反照率 albedo，也就是主纹理，分母的 $\pi$ 是一个半球积分，渲染方程算出来的结果会多乘一个 $\pi$ 项，故用分母除以 $\pi$ 来抵消。

$K_d$ 可以通过 $1 - K_s$ 来得出，剩下的高光项则是 BRDF 中最复杂最难计算的部分，下面先给出公式：

$$
f_{spec}(l, v) = \frac{D(h) \cdot F(v, h) \cdot G(l, v, h)}{4 (n \cdot l) (n \cdot v)}
$$

Cook-Torrance BRDF 的 specular 项分为三个部分：

- 法线分布函数，Normal Distribution Function，NDF（基于微平面理论）
- 几何函数，Geometry Function（基于微平面理论）
- 菲涅尔方程，Fresnel Equation（基于菲涅尔反射）

随着粗糙度上升，镜面反射的区域会增加，但是亮度会下降，这是符合物理规律的。

对于**金属**（Metallic）表面，与非金属相比遵从的反射与折射原理是相同的，但是**所有的**折射光都会被直接吸收而不会散开，所以金属表面不会有漫反射颜色，能看到的金属颜色是反射颜色：

![金属表面的反射与折射示意](/images/blog/pbr-notes/03-metal-refraction.png)

<Note>虽然非物理光照一般不用遵照能量守恒，但其金属度的概念却已经深入人心，即使卡通渲染，也经常会利用金属度来控制高光（镜射光）的强弱。</Note>

## 微平面理论

![微平面理论示意](/images/blog/pbr-notes/04-microfacet-theory.png)

微表面理论认为物体表面不可能是绝对光滑的，所有平面在微观尺度下，都是由许多凹凸不平的微小的理想镜面组成。粗糙度越高，表面越凹凸不平，粗糙度越低，表面越光滑。

![粗糙度对微平面法线分布的影响](/images/blog/pbr-notes/05-microfacet-roughness.png)

### 法线分布函数

为了大概描述物体表面凹凸不平的程度，引入了一个参数，粗糙度（Roughness），用粗糙度可以影响 NDF，NDF 大概描述了有多少**概率密度**的半程向量 h 等于法线 n，因为只有法线完全等于半程向量 h 的时候，光才能反射到摄像机里，粗糙度越高，微平面法线分布越杂乱，因此高光范围比较大，每个角度总能碰到一些微平面的法线等于 h，由于反射光达到摄像机的比例少，高光强度也不高，所以**粗糙度高的平面看起来高光很大很散且比较柔和**；反之**粗糙度低的平面看起来高光比较集中且强度较大**。

在 Cook-Torrance 中所用的 NDF 是 Trowbridge-Reitz GGX：

$$
NDF_{tr}(n, h, \alpha) = \frac{\alpha ^ 2}{\pi ((n \cdot h)^2 (\alpha ^ 2 - 1) + 1) ^ 2}
$$

其中 $\alpha$ 为粗糙度，$h$ 为半程向量。由此可以用代码对其进行实现了，下为 Unity Shader 中的实现：

```glsl title="NDF (Trowbridge-Reitz GGX)"
float NDF_TR_GGX(float3 N, float3 H, float R)
{
    float a = R;
    float a2 = a * a;
    float NdotH = max(0.0, dot(N, H));
    float NdotH2 = NdotH * NdotH;
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0001);
    denom = PI * denom * denom;
    return num / denom;
}
```

直接输出 NDF 的渲染结果如下：

![单独输出 NDF 的渲染结果](/images/blog/pbr-notes/06-ndf-result.png)

关于法线分布函数，更多详见 [notion 笔记](https://bush-table-8b2.notion.site/PBR-2b8148764a71800fb560c301d85efdd3#305148764a71800e963ed90ead7e9f14)。

### 几何函数

![几何函数示意](/images/blog/pbr-notes/07-geometry-function.png)

微平面理论认为，当一个表面足够粗糙的时候，它的崎岖程度足以形成自我遮挡的阴影，从而减弱表面光的反射能力和接受能力。如下图所示：

![粗糙表面的自我遮挡](/images/blog/pbr-notes/08-self-shadowing.png)

观察上图，不难发现，固定粗糙度的情况下，观察角度与法线的夹角越大，反射光就被遮挡的越多，如果我们的观察方向完全垂直于 p 点，那么就完全不会有任何遮挡——这又跟法线和观察方向的余弦值有关。

但同理，除了反射光的能力因为粗糙度减弱了，p 点接受光的能力也因为粗糙度减弱了，所以它同时还跟法线与光线方向的夹角的余弦值有关系。也就是说，几何函数也具有双向性，对调光源和相机的位置并不会改变最终的几何函数结果。

除了几何结构之外，它还跟粗糙度有关系，但这种关系显然不是线性关系的，因为如果表面接近于光滑，那么侧过来看还是垂直看影响都不大，所以我们还会对粗糙度进行一定的扭曲，也就是把它变成碗状的：

$$
k = t(\alpha)
$$

在 Cook-Torrance 的 PBR 模型中，这个扭曲函数会因为是针对直接光还是 IBL 有一定的区别，如果是针对直接光的话，它的公式为：

$$
k_{direct} = \frac{(\alpha + 1) ^ 2}{8}
$$

如果是 IBL，则公式为：

$$
k_{IBL} = \frac{\alpha ^ 2}{2}
$$

由于 p 点接受到的阳光和反射的光都受到粗糙度的结构几何影响，所以这两个行为可以通过同一个函数来表达，这个函数就是 Schlick-GGX，它也是原 GGX 几何函数的近似版本，其公式如下：

$$
G_{schlickGGX}(\omega) = \frac{n \cdot \omega}{(n \cdot \omega) (1 - k) + k}
$$

然后将视线方向和光源方向都作为参数计算出结果后乘到一起即可：

$$
G = G_{schlickGGX}(\omega_i) \cdot G_{schlickGGX}(\omega_o)
$$

虽然两者的表意不同，左侧的是影响光线接受率，所以也被称之为几何阴影，右侧影响的是光线反射，所以也被称之为几何遮蔽。下面给出一个基于 Unity 和 HLSL 的 Shader 实现：

```glsl title="Geometry (Smith / Schlick-GGX)"
float GeometrySchlickGGX(float3 N, float3 Dir, float k)
{
    float NDotDir = max(0.0, dot(N, Dir));
    float num = NDotDir;
    float denom = NDotDir * (1 - k) + k;
    return num / max(denom, 0.0001);
}

float GeometrySmith(float3 N, float3 V, float3 L, float K)
{
    float ggx1 = GeometrySchlickGGX(N, V, K);
    float ggx2 = GeometrySchlickGGX(N, L, K);
    return ggx1 * ggx2;
}
```

直接输出几何函数的渲染结果如下：

![单独输出几何函数的渲染结果](/images/blog/pbr-notes/09-geometry-result.png)

渲染结果看起来很像兰伯特模型，其实从公式中就可以看出它和兰伯特模型的关系。分子部分的 $n \cdot \omega$ 其实就是兰伯特，分母其实是做了一个插值：

$$
(n \cdot \omega) (1 - k) + k = lambert(1-k) + k = lerp(k, 1, lambert)
$$

分母可以理解为把 lambert 的值重映射到了值域为 $[k, 1]$ 的范围中：

$$
G_{schlickGGX} = \frac{lambert}{lerp(k, 1, lambert)}
$$

用兰伯特自身作为插值 t 来在 k 和 1 之间进行插值，这导致兰伯特光照模型比较亮的部分没啥区别，比较黑的部分会被提亮，但同时不改变 0 以下的值，也就是全黑的地方还是全黑的。这形成了下面的效果（这里移除了基于视线方向的几何函数）：

![仅保留光线方向的几何函数效果](/images/blog/pbr-notes/10-geometry-light-only.png)

而基于视线方向的几何函数，则相当于把这个亮面永远朝向相机：

![仅保留视线方向的几何函数效果](/images/blog/pbr-notes/11-geometry-view-only.png)

但其边缘的部分会变黑一点，两者叠加之后，会使得处于球体边缘的部分也变黑一些，因为随着视线或光线越来越平（贴着表面），理论上视线会被凸起物完全挡死。其有点像菲涅尔反射那种感觉：

![两个方向的几何函数叠加效果](/images/blog/pbr-notes/12-geometry-combined.png)

## 菲涅尔反射

菲涅尔反射是生活中常见的物理现象，看向近处的湖水时，基本看不到反光，看到更多的是水底的东西，而看向远处的湖水时，可以发现反光效果越来越明显。实际上，观察任何物体时，视角方向越接近于物体的水平方向，反光效果更明显。

<Note type="tip">
  特别要注意的是，菲涅尔反射就是高光的物理依据，前面提到的能量守恒里，我们计算高光分量 $K_s$ 实际上就是在计算菲涅尔反射的分量。
</Note>

我们常用施力克近似版本（Fresnel-Schlick）：

$$
F_{schlick} = F_0 + (1 - F_0) (1 - (h \cdot v)) ^ 5
$$

在 Unity 中用 HLSL 实现如下：

```glsl title="Fresnel-Schlick"
float3 FresnelSchlick(float3 H, float3 V, float3 F0)
{
    float HDotV = max(0.0, dot(H, V));
    return F0 + (1.0 - F0) * pow(saturate(1.0 - HDotV), 5.0);
}
```

单独输出的渲染效果如下：

![单独输出菲涅尔反射的渲染结果](/images/blog/pbr-notes/13-fresnel-result.png)

对于不同的材质，有一个大概的反射率表：

| 材质 | 基础反射率 |
| :--- | :--- |
| 水 | (0.02, 0.02, 0.02) |
| 皮肤 | (0.028, 0.028, 0.028) |
| 头发 | (0.046, 0.046, 0.046) |
| 石头 | (0.035~0.056, 0.035~0.056, 0.035~0.056) |
| 宝石 | (0.05~0.08, 0.05~0.08, 0.05~0.08) |
| 铁 | (0.562, 0.565, 0.578) |
| 铜 | (0.910, 0.778, 0.423) |
| 金 | (1.000, 0.782, 0.344) |
| 锌 | (0.664, 0.824, 0.850) |
| … | … |

金属的菲涅尔反射和非金属有很大的不同，非金属也可以称为绝缘体或介电质，首先是金属基础反射率针对不同波长的光线有不同的反射率，在图形学里表示为它的 sRGB 值不同，而介电质则通常没有这种区别。

其次，金属的基础反射率普遍都在 0.5 以上，0.5~0.99 之间，这导致它的菲涅尔效应不是特别明显，如下图所示：

![金属材质的菲涅尔效应对比](/images/blog/pbr-notes/14-fresnel-metal.png)

这同时也解释了为什么在渲染水体的时候一定会用到菲涅尔反射，因为水体的基础反射率为 0.02，它的菲涅尔反射效应非常之强烈。

当然，特别要注意的是，一个物体实际上要么是金属要么是介电质，一般是不会存在一个中间态的，但是在渲染领域，如果一个物质的金属度为 0.5，我们可以视在金属表面涂抹了一层泥土、锈迹或者它被什么特殊的物质刮花了，里面沾满了一些其他的材质比如塑料、碳之类的，导致它的金属表面被覆盖了 50%，以表现出了不同的外观，这也是为什么可以引入金属度这个概念。

所以在 PBR 工作流中，金属（金属度为 1.0）的基础反射率就等于自身的纹理色彩，而介电质则可以用一个常量值代替，一般物质的基础反射率均值在 0.04 左右。所以如果一个物质的金属度为 0.5，我们就用 0.5 来在常量反射值和金属自身的纹理色彩之间进行插值：

```glsl
float3 F0 = float3(0.04, 0.04, 0.04);
F0 = lerp(F0, albedo.rgb, metallic);
```

金属还有一个特点，没有漫反射，只有高光部分，所以用 metallic 属性来约束金属材质的漫反射属性：

$$
k_d = (1 - k_s)(1 - m)
$$

m 代表 metallic 金属度属性，如果一个物体金属度为 1，则漫反射为 0，如果金属度为 0，则漫反射为 1。

## 工程实现

```glsl title="PBR 直接光完整实现（Unity URP / HLSL）"
//  Throwbridge-Reitz GGX
float NDF_TR_GGX(float3 N, float3 H, float R)
{
    float a = R;
    float a2 = a * a;
    float NdotH = max(0.0, dot(N, H));
    float NdotH2 = NdotH * NdotH;
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0001);
    denom = PI * denom * denom;
    return num / denom;
}

//  Schlick-GGX
float GeometrySchlickGGX(float3 N, float3 Dir, float k)
{
    float NDotDir = max(0.0, dot(N, Dir));
    float num = NDotDir;
    float denom = NDotDir * (1 - k) + k;
    return num / max(denom, 0.0001);
}

float GeometrySmith(float3 N, float3 V, float3 L, float K)
{
    float ggx1 = GeometrySchlickGGX(N, V, K);
    float ggx2 = GeometrySchlickGGX(N, L, K);
    return ggx1 * ggx2;
}

//  Fresnel-Schlick
float3 FresnelSchlick(float3 H, float3 V, float3 F0)
{
    float HDotV = max(0.0, dot(H, V));
    return F0 + (1.0 - F0) * pow(saturate(1.0 - HDotV), 5.0);
}

// Cook-Torrance BRDF
// Fr = Kd * diffuse + Ks * specular
float3 BRDFDirectLight(float3 N, float3 V, float3 L, float4 albedo, float roughness, float metallic)
{
    float3 H = normalize(V + L + float3(0.0, 0.00001, 0.0));
    float D = NDF_TR_GGX(N, H, roughness);

    float K = roughness + 1;
    K = K * K * 0.125;
    float G = GeometrySmith(N, V, L, K);

    float3 F0 = lerp(float3(0.04, 0.04, 0.04), albedo.rgb, metallic);
    float3 F = FresnelSchlick(H, V, F0);

    float3 specular = (D * F * G) / (4 * max(0.0, dot(L, N)) * max(0.0, dot(V, N)) + 0.001);

    float3 Kd = (1 - F) * (1 - metallic);
    float3 diffuse = Kd * albedo.rgb / PI;

    return diffuse + specular;
}

float3 PBRDirectLight(float3 V, Light light, float4 albedo, float3 N, float roughness, float metallic)
{
    float3 L = normalize(light.direction);
    float3 incomingRadiance = light.color * light.distanceAttenuation * light.shadowAttenuation;
    float3 irradiance = incomingRadiance * saturate(dot(L, N));
    return BRDFDirectLight(N, V, L, albedo, roughness, metallic) * irradiance;
}

float4 FragmentPass(Fragment fragment) : SV_Target
{
    float3x3 worldToTangent = float3x3(
        normalize(fragment.tangentWS),
        normalize(fragment.bitangentWS),
        normalize(fragment.normalWS)
    );

    float4 albedo = tex2D(_AlbedoTex, fragment.uv);
    float metallic = tex2D(_MetallicTex, fragment.uv).r;
    float roughness = tex2D(_RoughnessTex, fragment.uv).r;
    float3 normal = normalize(mul(UnpackNormal(tex2D(_NormalTex, fragment.uv)), worldToTangent));

    float3 viewDir = normalize(GetCameraPositionWS() - fragment.positionWS);

    Light mainLight = GetMainLight(TransformWorldToShadowCoord(fragment.positionWS), fragment.positionWS, 1);
    float3 finalColor = PBRDirectLight(viewDir, mainLight, albedo, normal, roughness, metallic);

    for (int i = 0; i < GetAdditionalLightsCount(); i++)
    {
        Light light = GetAdditionalLight(i, fragment.positionWS, 1);
        finalColor += PBRDirectLight(viewDir, light, albedo, normal, roughness, metallic);
    }

    // 自发光
    float3 emission = tex2D(_EmissionTex, fragment.uv).rgb * _EmissionColor.rgb;
    finalColor += emission;

    return float4(finalColor, albedo.a);
}
```

# 环境光

（这部分笔记还在写，先占个位。）
