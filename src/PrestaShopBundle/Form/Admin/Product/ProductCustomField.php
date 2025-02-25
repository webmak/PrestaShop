<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

namespace PrestaShopBundle\Form\Admin\Product;

use PrestaShop\PrestaShop\Adapter\LegacyContext;
use PrestaShopBundle\Form\Admin\Type\CommonAbstractType;
use PrestaShopBundle\Form\Admin\Type\TranslateType;
use Symfony\Component\Form\Extension\Core\Type as FormType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * This form class is responsible to generate the product custom fields configuration form.
 */
class ProductCustomField extends CommonAbstractType
{
    private $translator;
    /**
     * @var object|LegacyContext
     */
    private $legacyContext;

    /**
     * Constructor.
     *
     * @param TranslatorInterface $translator
     * @param LegacyContext $legacyContext
     */
    public function __construct(TranslatorInterface $translator, LegacyContext $legacyContext)
    {
        $this->translator = $translator;
        $this->legacyContext = $legacyContext;
    }

    /**
     * {@inheritdoc}
     *
     * Builds form
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add(
            'id_customization_field',
            FormType\HiddenType::class,
            [
                'required' => false,
            ]
        )
            ->add('label', TranslateType::class, [
                'type' => FormType\TextType::class,
                'options' => ['constraints' => [
                    new Assert\NotBlank(),
                    new Assert\Length(['min' => 2]),
                ]],
                'locales' => $this->legacyContext->getLanguages(),
                'hideTabs' => true,
                'label' => $this->translator->trans('Label', [], 'Admin.Global'),
            ])
            ->add('type', FormType\ChoiceType::class, [
                'label' => $this->translator->trans('Type', [], 'Admin.Catalog.Feature'),
                'choices' => [
                    $this->translator->trans('Text', [], 'Admin.Global') => 1,
                    $this->translator->trans('File', [], 'Admin.Global') => 0,
                ],
                'attr' => [
                    'class' => 'c-select',
                ],
                'required' => true,
            ])
            ->add('require', FormType\CheckboxType::class, [
                'label' => $this->translator->trans('Required', [], 'Admin.Global'),
                'required' => false,
            ]);
    }

    /**
     * Returns the block prefix of this type.
     *
     * @return string The prefix name
     */
    public function getBlockPrefix()
    {
        return 'product_custom_field';
    }
}
